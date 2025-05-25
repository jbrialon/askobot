import { ChatMessage } from "@twurple/chat";
import { z } from "zod";

import { CommandHandler, CommandResponse } from "./types.js";
import { createOpenAI, buildPromptVars } from "../../utils/ai-functions.js";
import { getChannelInfo } from "../../utils/twitch-data.js";
import config from "../../../config.js";
import { response } from "express";
interface ChatHistory {
  [channel: string]: { role: string; content: string }[];
}

export class AskobotCommand implements CommandHandler {
  name = "askowbot";
  aliases = ["askobot"];
  excludedChannels = [];
  cooldown = undefined;
  private chatHistory: ChatHistory = {};

  private manageHistory(channel: string, user: string, message: string, response: string) {
    if (!this.chatHistory[channel]) {
      this.chatHistory[channel] = [];
    }

    // Add user message
    this.chatHistory[channel].push({
      role: "user",
      content: `@${user}: ${message}`,
    });

    // Add bot response
    this.chatHistory[channel].push({
      role: "assistant",
      content: response,
    });

    // Trim history if it exceeds capacity
    if (this.chatHistory[channel].length > config.memoryCapacity) {
      this.chatHistory[channel] = this.chatHistory[channel].slice(-config.memoryCapacity);
    }
  }

  async execute(channel: string, user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> {
    const message = params.join(" ");
    const channelInfo = await getChannelInfo(channel);
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    const openAI = createOpenAI();

    if (!channelConfig) {
      throw new Error("Channel configuration not found");
    }

    try {
      const result = await openAI({
        model: config.model,
        prompt: `The user "${user}" just asked: "${message}".`,
        promptVars: buildPromptVars({
          user,
          message,
          channelConfig,
          channelInfo,
        }),
        history: this.chatHistory[channel] || [],
        outputSchema: z.object({
          message: z.string(),
          emotion: z.enum(channelConfig.mood),
          animation: z.enum(config.animations),
        }),
      });
      // Manage chat history after successful response
      this.manageHistory(channel, user, message, result.message);

      return result;
    } catch (error) {
      console.error("Error in askobot:", error);
      const fallbackMessage = "Erreur : J'ai oublié comment parler poliment, désolé !";
      return {
        message: fallbackMessage,
        emotion: undefined,
        animation: undefined,
      };
    }
  }
}

export const askobotCommand = new AskobotCommand();
