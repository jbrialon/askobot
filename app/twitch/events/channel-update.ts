import { log } from "../../utils/log.js";
import { updateChannelInfo } from "../channel-data.ts";

export async function handleChannelUpdate(event: any) {
  const broadcasterLogin = event.broadcaster_user_login.toLowerCase() || event.broadcaster_user_name?.toLowerCase();
  const channel = broadcasterLogin === "testbroadcaster" ? "askowbol" : broadcasterLogin;

  if (!channel) {
    console.error("[channel-update] No broadcaster information in event:", event);
    return;
  }

  // Update channel data with new info
  updateChannelInfo(channel, {
    displayName: event.broadcaster_user_name,
    title: event.title,
    gameName: event.category_name,
    gameId: event.category_id,
  });

  log.info({
    user: "EventSub",
    message: `Channel update: ${event.broadcaster_user_name} - "${event.title}" | ${event.category_name}`,
    channel: channel,
  });
}
