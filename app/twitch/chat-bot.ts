import config from "../../config.js";

import { staticAuthProvider } from "./auth-clients.js";
import { ChatClient, ChatMessage } from "@twurple/chat";
import { EventEmitter } from "events";
import { z } from "zod";

import { createOpenAI, buildPromptVars } from "../utils/ai-functions.js";
import { getChannelInfo } from "../utils/twitch-data.js";

export class ChatBot extends EventEmitter {
  private config: typeof config;
  private channels: string[];
  private chatClient: ChatClient;
  private botName: string;
  private chatHistory: Record<string, { role: string; content: string }[]>;
  private openAI: ReturnType<typeof createOpenAI>;
  private commandHandlers: Record<string, (channel: string, user: string, params: string[], msg: ChatMessage) => void>;

  constructor() {
    super();
    this.config = config;
    this.botName = process.env["TWITCH_BOT_USERNAME"] as string;
    this.chatHistory = {};
    this.channels = this.config.channels
      .filter((channel) => {
        return process.env["APP_ENV"] === "development"
          ? channel.twitchChannel === "askowbol" // Only include #askowbol in development
          : channel.twitchChannel !== "askowbol"; // Exclude #askowbol in production
      })
      .map((channel) => channel.twitchChannel); // remove the # from the channel name

    console.log(this.channels);
    this.openAI = createOpenAI();
    this.chatClient = new ChatClient({
      authProvider: staticAuthProvider,
      channels: this.channels,
    });

    this.commandHandlers = {
      // bgrank: this.handleBGRank,
      // bgrankduo: this.handleBGRank,
      askowbot: this.handleAskobot,
      askobot: this.handleAskobot,
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.chatClient.onMessage(this.handleMessage.bind(this));
  }

  private handleMessage(channel: string, user: string, text: string, msg: ChatMessage) {
    // this.emit("bot-chat", {
    //   channel,
    //   tags,
    //   message,
    // });

    // Skip messages from the bot itself
    if (user.toLowerCase() === this.botName.toLowerCase()) {
      return;
    }
    if (text.startsWith("!")) {
      const [commandName, ...params] = text.slice(1).split(" ");
      if (!commandName) return;
      const command = this.commandHandlers[commandName.toLowerCase()];
      if (command) {
        command.call(this, channel, user, params, msg);
      }
    }
  }

  // https://twurple.js.org/reference/chat/classes/ChatMessage.html
  private handleAskobot(channel: string, user: string, params: string[], msg: ChatMessage) {
    console.log(`handleAskobot: ${channel}: ${user}: ${params.join(" ")}`);
    const message = params.join(" ");
    this.askAskobot(channel, user, message);
  }

  private async askAskobot(channel: string, user: string, message: string) {
    console.log(channel);
    const channelInfo = await getChannelInfo(channel);
    const channelConfig = this.config.channels.find((c) => c.twitchChannel === channel);

    if (!this.chatHistory[channel]) {
      this.chatHistory[channel] = [];
    }

    if (this.chatHistory[channel].length > this.config.memoryCapacity) {
      this.chatHistory[channel] = this.chatHistory[channel].slice(-this.config.memoryCapacity);
    }

    await this.openAI({
      model: this.config.model,
      prompt: `The user "${user}" just asked: "${message}".`,
      promptVars: buildPromptVars({
        user,
        message,
        channelConfig,
        channelInfo,
      }),
      history: this.chatHistory[channel],
      outputSchema: z.object({
        response: z.string(),
        emotion: z.enum(channelConfig.mood),
        animation: z.enum(config.animations),
      }),
    })
      .then((result) => {
        this.chatHistory[channel].push({
          role: "user",
          content: `@${user}: ${message}`,
        });
        this.chatHistory[channel].push({
          role: "assistant",
          content: result.response,
        });
        // this.logToDiscord(channel, "Askowbot", result.response);
        this.say(channel, `🤖 ${result.response} 🤖`);
        // this.emit("bot-voice", {
        //   channel,
        //   result,
        //   user,
        // });
      })
      .catch((error) => {
        console.error("Error in askAskobot:", error);
        const fallbackMessage = "Erreur : J'ai oublié comment parler poliment, désolé !";
        this.say(channel, `🤖 ${fallbackMessage} 🤖`);
        // this.logToDiscord(channel, "Askowbot", `❌ ERROR: ${error.message} ❌`);
      });
  }

  public connect() {
    this.chatClient.connect();
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
