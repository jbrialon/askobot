import { log } from "../../utils/log.js";
import askOS from "../../core/askOS.ts";
import { getChannelInfo } from "../../utils/twitch-data.js";
import discordBot from "../../discord/discord-bot.ts";
import { EmbedBuilder } from "discord.js";

import config from "../../../config.js";

export async function handleStreamOnline(event: any) {
  let channel = event?.broadcaster_user_login?.toLowerCase();

  // Test mode when we are testing from twitch-cli
  if (channel === "testbroadcaster") {
    channel = "askowbol";
  }

  const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
  const broadcasterName = event?.broadcaster_user_name;
  const streamType = event?.type; // we only care about "live" event
  const startedAt = event?.started_at;

  log.info({
    user: "EventSub",
    message: `Stream online: ${broadcasterName} (${streamType}) at ${startedAt}`,
    channel: channel,
  });

  // Send Discord notification if setup
  if (channelConfig?.discordNotifications) {
    const { guildId, channelId } = channelConfig.discordNotifications;
    const channelInfo = (await getChannelInfo(channel)) as any;

    const game = channelInfo.game;
    const isGame = channelInfo.isGame;

    // Generate a custom message from Askobot
    const contentType = isGame ? "game" : "category";
    const eventData = isGame
      ? `${channelInfo.displayName} has started the twitch live on the ${contentType} ${game}, give us a lot of details including spoils about the played game and encourage us to go see the live`
      : `${channelInfo.displayName} has started the twitch live and is doing ${game}, give us details about this streaming content`;

    const { message } = await askOS.reactToEvent({
      channel,
      eventType: "stream has come online",
      eventData,
      platform: "twitch",
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: channelInfo.displayName,
        iconURL: channelInfo.profileImage,
        url: `https://www.twitch.tv/${channel}`,
      })
      .setTitle(channelInfo.title)
      .setURL(`https://www.twitch.tv/${channel}`)
      .setColor("#9146FF")
      .setThumbnail(`https://static-cdn.jtvnw.net/ttv-boxart/${channelInfo.game_id}-272x380.jpg`)
      .addFields({
        name: channelInfo.isGame ? "Jeu" : "Catégorie",
        value: channelInfo.game,
        inline: false,
      })
      .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-1280x720.jpg`)
      .setFooter({
        text: "Twitch",
        iconURL: "https://www.twitch.tv/favicon.ico",
      })
      .setTimestamp();

    await discordBot.say(guildId, channelId, message, [embed]);
  }

  // TODO: Update bot status
}
