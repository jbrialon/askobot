import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const spellCommand: CommandHandler = {
  name: "spell",
  aliases: ["spells", "sort"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  shouldSynthesize: false,
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const spellName = params.join(" ");
      const spellData = fetchCardData(spellName, CARD_TYPES.SPELL);

      if (!spellData) {
        return {
          message: "Aucun sort trouvé portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${spellData.name.fr} - ${spellData.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching spell data:", error);
      throw error;
    }
  },
};
