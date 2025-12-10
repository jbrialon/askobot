import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const cardCommand: CommandHandler = {
  name: "card",
  aliases: ["carte"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const cardName = params.join(" ");
      const cardData = fetchCardData(cardName, CARD_TYPES.MINION);

      if (!cardData) {
        return {
          message: "Aucune carte trouvée portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      if (cardData.companion) {
        return {
          message: `${cardData.companion.name} - T${cardData.companion.tier}: ${cardData.companion.text}`,
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${cardData.name.fr} - T${cardData.battlegrounds.tavernTier}: ${cardData.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching card data:", error);
      throw error;
    }
  },
};
