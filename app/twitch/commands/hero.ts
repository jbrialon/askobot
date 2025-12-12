import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const heroCommand: CommandHandler = {
  name: "hero",
  aliases: ["hp", "héro"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const heroName = params.join(" ");
      const heroData = await fetchCardData(heroName, CARD_TYPES.HERO);

      if (!heroData) {
        return {
          message: "Aucun hero trouvé portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${heroData.name.fr}: ${heroData.text || "Aucune description disponible"}`,
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
