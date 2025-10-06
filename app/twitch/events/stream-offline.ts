import { log } from "../../utils/log.js";

export async function handleStreamOffline(event: any) {
  let channel = event?.broadcaster_user_login?.toLowerCase();

  // Test mode when we are testing from twitch-cli
  if (channel === "testbroadcaster") {
    channel = "askowbol";
  }

  const broadcasterName = event?.broadcaster_user_name;

  log.info({
    user: "EventSub",
    message: `Stream offline: ${broadcasterName}`,
    channel: channel,
  });
}
