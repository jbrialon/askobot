import { EventEmitter } from "events";
import { z } from "zod";

import config from "../../config.js";
import { getChannelInfo } from "../utils/twitch-data.js";
import { createOpenAI, buildPromptVars } from "../utils/ai-functions.js";
import type { History, AskobotResponse } from "./types.ts";

class Askobot extends EventEmitter {
  private history: History = {};

  private manageHistory(channel: string, user: string, message: string, response: string, platform: "twitch" | "discord" = "twitch") {
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
      content: `[${platform.toUpperCase()}] @${user}: ${message}`,
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

  async generateResponse(
    channel: string,
    user: string,
    message: string,
    platform: "twitch" | "discord" = "twitch",
  ): Promise<AskobotResponse> {
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    const channelInfo = await getChannelInfo(channel);
    const openAI = createOpenAI();

    if (!channelConfig) {
      throw new Error(`Channel configuration not found for channel: ${channel}`);
    }

    try {
      const result = await openAI({
        model: config.model,
        prompt: `The user "${user}" asked: "${message}".`,
        promptVars: buildPromptVars({
          user,
          message,
          channelConfig,
          channelInfo,
          platform,
        }),
        history: this.history[channel]?.messages || [],
        outputSchema: z.object({
          message: z.string(),
          emotion: z.enum(channelConfig.mood as [string, ...string[]]),
          animation: z.enum(config.animations as [string, ...string[]]),
        }),
      });

      // Manage chat history after successful response
      this.manageHistory(channel, user, message, result.message, platform);

      return {
        ...result,
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error in askobot:", error);
      const fallbackMessage = "<Error.01.beep.boop>";
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
