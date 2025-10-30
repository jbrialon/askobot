import { log } from "../../utils/log.js";
import askOS from "../../core/askOS.ts";
import { setStreamOnline, getChannelData, type ChannelData } from "../channel-data.ts";
import discordBot from "../../discord/discord-bot.ts";
import { EmbedBuilder } from "discord.js";
import { EventSubStreamOnlineEvent } from "@twurple/eventsub-base";
import config from "../../../config.js";

export async function handleStreamOnline(event: EventSubStreamOnlineEvent) {
  const channel = event.broadcasterName.toLowerCase() === "testbroadcaster" ? "askowbol" : event.broadcasterName.toLowerCase();

  // Update channel data with stream online status
  await setStreamOnline(channel);

  log.info({
    user: "EventSub",
    message: `Stream online: ${event.broadcasterDisplayName} at ${event.startDate.toISOString()}`,
    channel: channel,
  });

  // Send Discord notification if configured
  const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
  if (channelConfig?.discordNotifications) {
    await sendDiscordNotification(channel, channelConfig.discordNotifications);
  }

  // TODO: Update bot status
}

async function sendDiscordNotification(channel: string, notificationConfig: { guildId: string; channelId: string }) {
  const { guildId, channelId } = notificationConfig;
  const channelData = await getChannelData(channel);

  if (!channelData) {
    console.error(`[stream-online] Channel data not found for ${channel}`);
    return;
  }

  const eventData = buildEventData(channelData);
  const { message } = await askOS.reactToEvent({
    channel,
    eventType: "stream has come online",
    eventData,
    platform: "twitch",
  });

  const embed = buildDiscordEmbed(channel, channelData);
  await discordBot.say(guildId, channelId, message, [embed]);
}

function buildEventData(channelData: ChannelData): string {
  const { displayName, gameName, isGame } = channelData;
  const contentType = isGame ? "game" : "category";

  return isGame
    ? `${displayName} has started the twitch live on the ${contentType} ${gameName}, give us a lot of details including spoils about the played game and encourage us to go see the live`
    : `${displayName} has started the twitch live and is doing ${gameName}, give us details about this streaming content`;
}

function buildDiscordEmbed(channel: string, channelData: ChannelData): EmbedBuilder {
  const { displayName, profilePictureUrl, title, gameName, gameThumbnail, thumbnail, isGame } = channelData;
  const twitchUrl = `https://www.twitch.tv/${channel}`;

  return new EmbedBuilder()
    .setAuthor({
      name: displayName,
      iconURL: profilePictureUrl,
      url: twitchUrl,
    })
    .setTitle(title)
    .setURL(twitchUrl)
    .setColor("#9146FF")
    .setThumbnail(gameThumbnail || null)
    .addFields({
      name: isGame ? "Jeu" : "Catégorie",
      value: gameName,
      inline: false,
    })
    .setImage(thumbnail || null)
    .setFooter({
      text: "Twitch",
      iconURL: "https://www.twitch.tv/favicon.ico",
    })
    .setTimestamp();
}
