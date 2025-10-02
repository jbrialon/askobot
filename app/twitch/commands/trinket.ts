import { ChatMessage } from "@twurple/chat";
import { CommandHandler, CommandResponse } from "./types.js";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const trinketCommand: CommandHandler = {
  name: "trinket",
  aliases: ["trinkets", "bibelot", "bibelots"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const trinketName = params.join(" ");
      const trinketData = fetchCardData(trinketName, CARD_TYPES.TRINKET);

      if (!trinketData) {
        return {
          message: "Aucun trinket trouvé portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${trinketData.name.fr}: ${trinketData.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching trinket data:", error);
      throw error;
    }
  },
};
