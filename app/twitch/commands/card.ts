import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData } from "../../utils/battleground.js";

export const cardCommand: CommandHandler = {
  name: "card",
  aliases: ["carte", "crea"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const cardName = params.join(" ");
      const cardData = fetchCardData(cardName, false);

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
