import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const buddyCommand: CommandHandler = {
  name: "buddy",
  aliases: ["companion", "compagnon", "buddies"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const heroName = params.join(" ");
      const heroData = fetchCardData(heroName, CARD_TYPES.HERO);

      if (!heroData || !heroData.companion) {
        return {
          message: "Aucune information trouvée pour le buddy 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${heroData.companion.name} - T${heroData.companion.tier}: ${heroData.companion.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching hero data:", error);
      throw error;
    }
  },
};
