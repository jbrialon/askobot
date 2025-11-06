import { log } from "../../utils/log.js";
import askOS from "../../core/askOS.ts";
import chatBot from "../chat-bot.ts";
import { setStreamOnline, type ChannelData } from "../channel-data.ts";
import discordBot from "../../discord/discord-bot.ts";
import { EmbedBuilder } from "discord.js";
import config from "../../../config.js";

const EVENT_STREAM_ONLINE = "stream.online";

/**
 * Handles the stream.online EventSub notification when a broadcaster goes live.
 *
 * @param event - EventSub stream.online event payload containing broadcaster information
 */
export async function handleStreamOnline(event: any) {
  // Extract broadcaster login, handling test events from Twitch CLI
  const broadcasterLogin = event.broadcaster_user_login.toLowerCase() || event.broadcaster_user_name?.toLowerCase();
  const channel = broadcasterLogin === "testbroadcaster" ? "askowbol" : broadcasterLogin;

  if (!channel) {
    console.error("[stream-online] No broadcaster information in event:", event);
    return;
  }

  // Update channel data with stream online status
  const channelData = await setStreamOnline(channel);

  log.info({
    user: "EventSub",
    message: `Stream online: ${event.broadcaster_user_name} at ${event.started_at}`,
    channel: channel,
  });

  const response = await askOS.reactToEvent({
    channel,
    eventType: EVENT_STREAM_ONLINE,
    eventData: `generate a system like message that the live has started and you are recording the session data, mimic recording on tape sound`,
    platform: "twitch",
  });

  if (response?.message) {
    chatBot.say(channel, {
      ...response,
      emoji: "🚨",
    });
  }

  // Send Discord notification with AskOS-generated message if configured for this channel
  const channelConfig = config.channels.find((c) => c.twitchChannel === channel);

  if (channelConfig?.discordNotifications) {
    await sendDiscordNotification(channel, channelConfig.discordNotifications, channelData);
  }
}

/**
 * Sends a Discord notification when a stream goes live.
 *
 * @param channel - Twitch channel name (lowercase)
 * @param notificationConfig - Discord server and channel IDs for the notification
 */
async function sendDiscordNotification(
  channel: string,
  notificationConfig: { guildId: string; channelId: string },
  channelData: ChannelData,
) {
  const { guildId, channelId } = notificationConfig;

  if (!channelData) {
    console.error(`[stream-online] Channel data not found for ${channel}`);
    return;
  }

  // Build event context for AI to generate personalized stream announcement
  const eventData = buildEventData(channelData);
  const { message } = await askOS.reactToEvent({
    channel,
    eventType: EVENT_STREAM_ONLINE,
    eventData,
    platform: "twitch",
  });

  // Create Discord embed with stream information and send notification
  const embed = buildDiscordEmbed(channel, channelData);
  await discordBot.say(guildId, channelId, message, [embed]);
}

/**
 * Builds the event context string for AskOS to generate an appropriate stream announcement.
 *
 * @param channelData - Channel information including display name, game/category, and stream details
 * @returns Prompt string instructing AskOS how to announce the stream
 */
function buildEventData(channelData: ChannelData): string {
  const { displayName, gameName, isGame } = channelData;
  const contentType = isGame ? "game" : "category";

  return isGame
    ? `${displayName} has started the twitch live on the ${contentType} ${gameName}, give us a lot of details including spoils about the played game and encourage us to go see the live`
    : `${displayName} has started the twitch live and is doing ${gameName}, give us details about this streaming content`;
}

/**
 * build Discord Embed
 */

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
