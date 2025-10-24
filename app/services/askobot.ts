import { EventEmitter } from "events";

import askOS from "../core/askOS.ts";

import type { AskobotResponse } from "./types.ts";

class Askobot extends EventEmitter {
  async generateResponse(
    channel: string,
    user: string,
    message: string,
    platform: "twitch" | "discord" = "twitch",
  ): Promise<AskobotResponse> {
    try {
      const response = await askOS.generateResponse({
        channel,
        user,
        message,
        platform,
      });

      return {
        ...response,
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
