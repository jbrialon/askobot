import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const timewarpCommand: CommandHandler = {
  name: "timewarp",
  aliases: ["warp", "chrono", "chronodistordu"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const cardName = params.join(" ");
      const cardData = await fetchCardData(cardName, CARD_TYPES.TIMEWARP);

      if (!cardData) {
        return {
          message: "Aucune carte chronodistordue trouvé portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      const tierLabel =
        cardData.battlegrounds.tavernTier === 3
          ? "chronodistorsion mineure"
          : cardData.battlegrounds.tavernTier === 5
            ? "chronodistorsion majeure"
            : `T${cardData.battlegrounds.tavernTier}`;

      return {
        message: `${cardData.name.fr} - ${tierLabel}: ${cardData.text || "Aucune description disponible"}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching timewarp card data:", error);
      throw error;
    }
  },
};
