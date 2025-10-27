import { log } from "../../utils/log.js";
import askOS from "../../core/askOS.ts";
import { getChannelInfo } from "../../utils/twitch-data.js";
import discordBot from "../../discord/discord-bot.ts";

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
    const channelInfo = await getChannelInfo(channel);
    const game = (channelInfo as any)?.game || "";
    const isGame = (channelInfo as any)?.isGame || false;

    // Generate a custom message from Askobot
    const contentType = isGame ? "game" : "category";
    const eventData = isGame
      ? `${channel} has started the twitch live on the ${contentType} ${game}, give us a lot of details including spoils about the played game and encourage us to go see the live`
      : `${channel} has started the twitch live and is doing ${game}, give us details about this streaming content`;

    const response = await askOS.reactToEvent({
      channel,
      eventType: "stream has come online",
      eventData,
      platform: "twitch",
    });

    const message = `${response.message}\nhttps://twitch.tv/${channel}`;

    await discordBot.say(guildId, channelId, message);
  }

  // TODO: Update bot status
}
