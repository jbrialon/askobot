import { staticAuthProvider } from "./auth-clients.js";
import { ChatClient, ChatMessage } from "@twurple/chat";
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
              user: user,
              channel: channel,
              question: params.join(" "),
              response: response.message,
            });

            this.emit("bot-voice", {
              channel,
              response,
              user,
            });
          }
        } catch (error) {
          console.error(`Error executing command ${commandName}:`, error);
          log.error({
            user: user,
            message: error.message,
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
}
