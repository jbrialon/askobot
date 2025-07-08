import { staticAuthProvider } from "./auth-clients.js";
import { ChatClient, ChatMessage, parseChatMessage } from "@twurple/chat";
import { EventEmitter } from "events";

import config from "../../config.js";
import { commands } from "./commands/index.js";
import { log } from "../utils/utils.js";

export class ChatBot extends EventEmitter {
  private config: typeof config;
  private channels: string[];
  private chatClient: ChatClient;
  private botName: string;
  private lastCommandTime: Record<string, Record<string, number>>;
  private isOBS: boolean = false;

  constructor() {
    super();
    this.config = config;
    this.botName = process.env["TWITCH_BOT_USERNAME"] as string;
    this.lastCommandTime = {};
    this.channels = this.config.channels
      .filter((channel) => {
        return process.env["APP_ENV"] === "development"
          ? channel.twitchChannel === "askowbol" // Only include #askowbol in development
          : channel.twitchChannel !== "askowbol"; // Exclude #askowbol in production
      })
      .map((channel) => channel.twitchChannel);

    this.chatClient = new ChatClient({
      webSocket: true,
      authProvider: staticAuthProvider,
      channels: this.channels,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.chatClient.onMessage(this.handleMessage.bind(this));
  }

  isOnCooldown(channel: string, commandName: string, cooldownMinutes: number): boolean {
    const currentTime = Date.now();
    const cooldownTime = cooldownMinutes * 60 * 1000;

    if (!this.lastCommandTime[channel]) {
      this.lastCommandTime[channel] = {};
    }

    if (this.lastCommandTime[channel][commandName] && currentTime - this.lastCommandTime[channel][commandName] < cooldownTime) {
      return true;
    }

    // Update the last command time for the channel and command
    this.lastCommandTime[channel][commandName] = currentTime;
    return false;
  }

  // https://twurple.js.org/reference/chat/classes/ChatMessage.html
  private async handleMessage(channel: string, user: string, text: string, msg: ChatMessage) {
    // Skip messages from the bot itself
    if (user.toLowerCase() === this.botName.toLowerCase()) {
      return;
    }

    // Emit user message for chat history
    this.emit("bot-chat", {
      channel,
      tags: {
        "display-name": msg.userInfo.displayName,
        username: user,
        color: msg.userInfo.color,
        emotes: msg.emoteOffsets,
        timestamp: Date.now(),
      },
      message: parseChatMessage(text, msg.emoteOffsets),
      user: msg.userInfo.displayName,
    });

    if (text.startsWith("!")) {
      const [commandName, ...params] = text.slice(1).split(" ");
      if (!commandName) {
        return;
      }

      const command = commands.find((cmd) => cmd.name === commandName.toLowerCase() || cmd.aliases?.includes(commandName.toLowerCase()));

      if (command) {
        try {
          // Check if command is excluded from this channel
          if (command.excludedChannels?.includes(channel)) {
            return;
          }

          // Check cooldown only if the command has one
          if (command.cooldown && this.isOnCooldown(channel, command.name, command.cooldown)) {
            return;
          }

          const response = await command.execute(channel, user, params, msg);

          if (response) {
            this.say(channel, response.message);
            log.command({
              user: msg.userInfo.displayName,
              channel: channel,
              question: params.join(" "),
              response: response.message,
              command: commandName,
            });

            // Emit bot response for chat history
            this.emit("bot-chat", {
              channel,
              tags: {
                "display-name": "Askowbot",
                username: this.botName,
                color: "#FF6B6B",
                emotes: {},
                timestamp: Date.now(),
              },
              message: parseChatMessage(response.message, new Map()),
              user: "Askowbot",
            });

            this.emit("bot-response", {
              channel,
              response,
              user: msg.userInfo.displayName,
              timestamp: Date.now(),
              type: "command",
              command: commandName,
            });
          }
        } catch (error) {
          console.error(`Error executing command ${commandName}:`, error);
          log.error({
            user: user,
            message: error instanceof Error ? error.message : String(error),
            channel: channel,
          });
        }
      }
    }
  }

  public connect() {
    this.chatClient.connect();
    log.success({
      user: "System",
      message: "🚀 Askowbot Launch success 🚀",
      channel: "System",
    });
  }

  public say(channel: string, message: string) {
    this.chatClient.say(channel, message);
  }

  public addChannel(channel: string) {
    this.channels.push(channel);
    this.chatClient.join(channel);
  }

  public removeChannel(channel: string) {
    this.channels = this.channels.filter((c) => c !== channel);
    this.chatClient.part(channel);
  }

  public setIsOBS(isOBS: boolean) {
    this.isOBS = isOBS;
    console.log(`ChatBot OBS status: ${isOBS}`);
  }

  public getIsOBS(): boolean {
    return this.isOBS;
  }
}
