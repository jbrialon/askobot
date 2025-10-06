import { log } from "../../utils/log.js";

export async function handleStreamOnline(event: any) {
  let channel = event?.broadcaster_user_login?.toLowerCase();

  // Test mode when we are testing from twitch-cli
  if (channel === "testbroadcaster") {
    channel = "askowbol";
  }

  const broadcasterName = event?.broadcaster_user_name;
  const streamType = event?.type; // we only care about "live" event
  const startedAt = event?.started_at;

  log.info({
    user: "EventSub",
    message: `Stream online: ${broadcasterName} (${streamType}) at ${startedAt}`,
    channel: channel,
  });

  // TODO
  // - Send notification to Discord with a custom message from Askobot
  // - Update bot status
}
