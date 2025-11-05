import { log } from "../../utils/log.js";
import askOS from "../../core/askOS.ts";
import { getChannelData } from "../channel-data.ts";
import chatBot from "../chat-bot.ts";

export async function handleChannelRaid(event: any) {
  const broadcasterLogin = event.broadcaster_user_login?.toLowerCase() || event.broadcaster_user_name?.toLowerCase();
  const channel = broadcasterLogin === "testbroadcaster" ? "askowbol" : broadcasterLogin;

  const from = event?.from_broadcaster_user_name;
  const viewers = event?.viewers || 0;

  if (!channel) {
    console.error("[channel-raid] No broadcaster information in event:", event);
    return;
  }

  if (!from) {
    console.error("[channel-raid] No raider information in event:", event);
    return;
  }

  log.info({
    user: "EventSub",
    message: `Raid from ${from} with ${viewers} viewers`,
    channel,
  });

  // Only react to raids with more than 5 viewers
  if (viewers <= 5) {
    return;
  }

  const channelData = await getChannelData(channel);

  if (channelData?.isLive) {
    const response = await askOS.reactToEvent({
      channel,
      eventType: "stream has received a raid",
      eventData: `${channel} has received a raid from @${from} with ${viewers} viewers, thank him, welcome them and explain them what we are doing here`,
    });

    if (response?.message) {
      chatBot.say(channel, {
        ...response,
        emoji: "🎉",
      });
    }
  }
}
