import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const heroCommand: CommandHandler = {
  name: "hero",
  aliases: ["hp", "héro"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  shouldSynthesize: false,
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const heroName = params.join(" ");
      const heroData = fetchCardData(heroName, CARD_TYPES.HERO);

      if (!heroData) {
        return {
          message: "Aucun hero trouvé portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${heroData.name.fr} - ${heroData.text}`,
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
