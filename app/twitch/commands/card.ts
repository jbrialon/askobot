import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
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
          message: "🤖 Aucune carte trouvée portant ce nom 🤔 🤖",
          emotion: "",
          animation: "",
        };
      }

      return {
        message: `🤖 ${cardData.name.fr} - ${cardData.text} 🤖`,
        emotion: "",
        animation: "",
      };
    } catch (error) {
      console.error("Error fetching card data:", error);
      throw error;
    }
  },
};
