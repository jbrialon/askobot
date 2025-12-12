import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchCardData, CARD_TYPES } from "../../utils/battleground.js";

export const questCommand: CommandHandler = {
  name: "quest",
  aliases: ["quests", "quête", "quete", "rewards", "récompenses"],
  cooldown: 0,
  excludedChannels: ["lbineau"],
  execute: async (_channel: string, _user: string, params: string[], _msg: ChatMessage): Promise<CommandResponse> => {
    try {
      const questName = params.join(" ");
      const questData = await fetchCardData(questName, CARD_TYPES.REWARD);

      if (!questData) {
        return {
          message: "Aucune quête trouvée portant ce nom 🤔",
          emotion: "",
          animation: "",
          emoji: "🤖",
        };
      }

      return {
        message: `${questData.name.fr}: ${questData.text}`,
        emotion: "",
        animation: "",
        emoji: "🤖",
      };
    } catch (error) {
      console.error("Error fetching quest data:", error);
      throw error;
    }
  },
};
