import { log } from "../../utils/log.js";
import { setStreamOffline } from "../channel-data.ts";

export async function handleStreamOffline(event: any) {
  const broadcasterLogin = event.broadcaster_user_login.toLowerCase() || event.broadcaster_user_name?.toLowerCase();
  const channel = broadcasterLogin === "testbroadcaster" ? "askowbol" : broadcasterLogin;

  if (!channel) {
    console.error("[stream-offline] No broadcaster information in event:", event);
    return;
  }

  // Update channel data with stream offline status
  setStreamOffline(channel);

  log.info({
    user: "EventSub",
    message: `Stream offline: ${event.broadcaster_user_name}`,
    channel: channel,
  });
}
