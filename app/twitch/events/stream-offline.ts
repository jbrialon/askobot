import { log } from "../../utils/log.js";
import { setStreamOffline } from "../channel-data.ts";
import { EventSubStreamOfflineEvent } from "@twurple/eventsub-base";

export async function handleStreamOffline(event: EventSubStreamOfflineEvent) {
  const channel = event.broadcasterName.toLowerCase() === "testbroadcaster" ? "askowbol" : event.broadcasterName.toLowerCase();

  // Update channel data with stream offline status
  setStreamOffline(channel);

  log.info({
    user: "EventSub",
    message: `Stream offline: ${event.broadcasterDisplayName}`,
    channel: channel,
  });
}
