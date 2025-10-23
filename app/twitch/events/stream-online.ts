import { log } from "../../utils/log.js";
import askobot from "../../services/askobot.ts";
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

    // Generate a custom message from Askobot
    const prompt = `le stream de ${broadcasterName} est en ligne, genere un message pour l'annoncer sur le discord`;
    const result = await askobot.generateResponse(channel, "system", prompt);

    const message = `${result.message}\n\nhttps://twitch.tv/${channel}`;

    await discordBot.say(guildId, channelId, message);
  }

  // TODO: Update bot status
}
