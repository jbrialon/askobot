import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const anomalyCommand: CommandHandler = {
  name: "anomaly",
  aliases: ["anomalies", "anomalie"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  shouldSynthesize: false,
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const anomalyName = params.join(" ");
      const anomalyData = fetchCardData(anomalyName, CARD_TYPES.ANOMALY);

      if (!anomalyData) {
        return {
          message: "Aucune anomalie trouvée portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${anomalyData.name.fr} - ${anomalyData.text}`,
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
