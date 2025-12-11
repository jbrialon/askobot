import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const anomalyCommand: CommandHandler = {
  name: "anomaly",
  aliases: ["anomalies", "anomalie"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const anomalyName = params.join(" ");
      const anomalyData = await fetchCardData(anomalyName, CARD_TYPES.ANOMALY);

      if (!anomalyData) {
        return {
          message: "Aucune anomalie trouvée portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${anomalyData.name.fr}: ${anomalyData.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching anomaly data:", error);
      throw error;
    }
  },
};
