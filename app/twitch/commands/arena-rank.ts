import type { ChatMessage } from "@twurple/chat";
import type { CommandHandler, CommandResponse } from "./types.ts";
import { fetchLeaderboardData, LEADERBOARD_TYPES } from "../../utils/battleground.js";
import { getFrenchOrdinal } from "../../utils/utils.js";
import config from "../../../config.js";
import { askobotCommand } from "./askobot.ts";

export const arenaRankCommand: CommandHandler = {
  name: "arenarank",
  aliases: ["arena", "ar"],
  cooldown: 0.5,
  excludedChannels: ["lbineau"],
  execute: async (channel: string, user: string, params: string[], msg: ChatMessage): Promise<CommandResponse> => {
    try {
      if (!params || params.length === 0) {
        // Use the channel's battletag from config if no parameter provided
        const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
        params[0] = channelConfig ? channelConfig.battletag : "";
      }

      const player = await fetchLeaderboardData(params, LEADERBOARD_TYPES.ARENA);

      if (player) {
        const rankEmojis = {
          1: "🏆",
          2: "🥈",
          3: "🥉",
          4: "🎯",
        } as const;
        const emote = rankEmojis[player.rank as keyof typeof rankEmojis] || "⚔";
        const messageToSend = `${player.accountid} : ${getFrenchOrdinal(player.rank)} (${player.rating}) [📛⏳ 30s]`;

        return {
          message: messageToSend,
          emotion: "",
          animation: "",
          emoji: emote,
        };
      } else {
        // if Player is not found, we generate a creative message
        return await askobotCommand.execute(
          channel,
          user,
          [`invente un message comme quoi le joueur ${params[0]} n'a pas été trouvé dans le classement de l'arène`],
          msg,
        );
      }
    } catch (error) {
      console.error("Error fetching arena leaderboard data:", error);
      throw error;
    }
  },
};
