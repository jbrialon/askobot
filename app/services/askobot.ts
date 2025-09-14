import { EventEmitter } from "events";
import { z } from "zod";

import config from "../../config.js";
import { getChannelInfo } from "../utils/twitch-data.js";
import { createOpenAI, buildPromptVars } from "../utils/ai-functions.js";

interface History {
  [channel: string]: {
    messages: { role: string; content: string }[];
    lastActivity: number;
  };
}

interface AskobotResponse {
  message: string;
  emotion?: string;
  animation?: string;
  emoji?: string;
}

class Askobot extends EventEmitter {
  private history: History = {};

  private manageHistory(channel: string, user: string, message: string, response: string) {
    if (!this.history[channel]) {
      this.history[channel] = {
        messages: [],
        lastActivity: Date.now(),
      };
    }

    const now = Date.now();
    const fifteenMinutesAgo = now - config.memoryDuration * 60 * 1000;

    // Check if last activity was more than 15 minutes ago
    if (this.history[channel].lastActivity < fifteenMinutesAgo) {
      // Clear history if too old
      this.history[channel].messages = [];
    }

    // Add user message
    this.history[channel].messages.push({
      role: "user",
      content: `@${user}: ${message}`,
    });

    // Add bot response
    this.history[channel].messages.push({
      role: "assistant",
      content: response,
    });

    // Update last activity timestamp
    this.history[channel].lastActivity = now;

    // Trim history if it exceeds capacity
    if (this.history[channel].messages.length > config.memoryCapacity) {
      this.history[channel].messages = this.history[channel].messages.slice(-config.memoryCapacity);
    }
  }

  async generateResponse(channel: string, user: string, message: string): Promise<AskobotResponse> {
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    const channelInfo = await getChannelInfo(channel);
    const openAI = createOpenAI();

    try {
      const result = await openAI({
        model: config.model,
        prompt: `The user "${user}" asked: "${message}".`,
        promptVars: buildPromptVars({
          user: user,
          message,
          channelConfig,
          channelInfo,
        }),
        history: this.history[channel]?.messages || [],
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
      const fallbackMessage = "Erreur : J'ai oublié comment parler poliment, désolé !";
      return {
        message: fallbackMessage,
        emotion: "",
        animation: "",
        emoji: "😵",
      };
    }
  }
}

const askobot = new Askobot();
export default askobot;
