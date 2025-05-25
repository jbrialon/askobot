import { ChatMessage } from "@twurple/chat";

import { CommandHandler } from "./types.js";
import { fetchLeaderboardData } from "../../utils/battleground.js";
import { getFrenchOrdinal } from "../../utils/utils.js";
import config from "../../../config.js";
import { askobotCommand } from "./askobot.js";

export const bgRankCommand: CommandHandler = {
  name: "bgrank",
  aliases: ["bgrankduo"],
  cooldown: 0.5,
  excludedChannels: ["lbineau"],
  execute: async (channel: string, user: string, params: string[], msg: ChatMessage) => {
    const isDuo = msg.text.startsWith("!bgrankduo");

    try {
      if (!params || params.length === 0) {
        // Use the channel's battletag from config if no parameter provided
        const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
        params[0] = channelConfig ? channelConfig.battletag : "";
      }

      const player = await fetchLeaderboardData(params, isDuo);

      if (player) {
        const rankEmojis = {
          1: "🥇",
          2: "🥈",
          3: "🥉",
          4: "🍫",
        } as const;
        const emoji = rankEmojis[player.rank as keyof typeof rankEmojis] || "🤖";
        const messageToSend = `${emoji} ${player.accountid} : ${getFrenchOrdinal(
          player.rank,
        )} (${player.rating}) ${isDuo ? "(duo)" : ""} ${emoji}  [📛⏳ 30s]`;
        return messageToSend;
      } else {
        // if Player is not found, we to generate a creative message
        return await askobotCommand.execute(
          channel,
          user,
          [`invente un message comme quoi le joueur ${params[0]} n'a pas été trouvé dans le classement`],
          msg,
        );
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      throw error;
    }
  },
};
