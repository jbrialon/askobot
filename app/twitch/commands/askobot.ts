import { ChatMessage } from "@twurple/chat";
import { z } from "zod";

import { CommandHandler, CommandResponse } from "./types.js";
import { createOpenAI, buildPromptVars } from "../../utils/ai-functions.js";
import { getChannelInfo } from "../../utils/twitch-data.js";
import config from "../../../config.js";

interface ChatHistory {
  [channel: string]: {
    messages: { role: string; content: string }[];
    lastActivity: number;
  };
}

export class AskobotCommand implements CommandHandler {
  name = "askowbot";
  aliases = ["askobot"];
  excludedChannels = [];
  cooldown = 0;
  shouldSynthesize = true;
  private chatHistory: ChatHistory = {};

  private manageHistory(channel: string, user: string, message: string, response: string) {
    if (!this.chatHistory[channel]) {
      this.chatHistory[channel] = {
        messages: [],
        lastActivity: Date.now(),
      };
    }

    const now = Date.now();
    const fifteenMinutesAgo = now - config.memoryDuration * 60 * 1000;

    // Check if last activity was more than 15 minutes ago
    if (this.chatHistory[channel].lastActivity < fifteenMinutesAgo) {
      // Clear history if too old
      this.chatHistory[channel].messages = [];
    }

    // Add user message
    this.chatHistory[channel].messages.push({
      role: "user",
      content: `@${user}: ${message}`,
    });

    // Add bot response
    this.chatHistory[channel].messages.push({
      role: "assistant",
      content: response,
    });

    // Update last activity timestamp
    this.chatHistory[channel].lastActivity = now;

    // Trim history if it exceeds capacity
    if (this.chatHistory[channel].messages.length > config.memoryCapacity) {
      this.chatHistory[channel].messages = this.chatHistory[channel].messages.slice(-config.memoryCapacity);
    }
  }

  async execute(channel: string, user: string, params: string[], msg: ChatMessage): Promise<CommandResponse> {
    const message = params.join(" ");
    const channelInfo = await getChannelInfo(channel);
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    const openAI = createOpenAI();
    const displayName = msg.userInfo.displayName || user;

    if (!channelConfig) {
      throw new Error("Channel configuration not found");
    }

    try {
      const result = await openAI({
        model: config.model,
        prompt: `The user "${displayName}" asked: "${message}".`,
        promptVars: buildPromptVars({
          user: displayName,
          message,
          channelConfig,
          channelInfo,
        }),
        history: this.chatHistory[channel]?.messages || [],
        outputSchema: z.object({
          message: z.string(),
          emotion: z.enum(channelConfig.mood),
          animation: z.enum(config.animations),
        }),
      });
      // Manage chat history after successful response
      this.manageHistory(channel, user, message, result.message);

      return {
        ...result,
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error in askobot:", error);
      const fallbackMessage = "🤖 Erreur : J'ai oublié comment parler poliment, désolé ! 🤖";
      return {
        message: fallbackMessage,
        emotion: "",
        animation: "",
      };
    }
  }
}

export const askobotCommand = new AskobotCommand();
