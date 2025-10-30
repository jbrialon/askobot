import { log } from "../../utils/log.js";
import { updateChannelInfo } from "../channel-data.ts";
import { EventSubChannelUpdateEvent } from "@twurple/eventsub-base";

export async function handleChannelUpdate(event: EventSubChannelUpdateEvent) {
  const channel = event.broadcasterName.toLowerCase() === "testbroadcaster" ? "askowbol" : event.broadcasterName.toLowerCase();

  // Update channel data with new info
  updateChannelInfo(channel, {
    displayName: event.broadcasterDisplayName,
    title: event.streamTitle,
    gameName: event.categoryName,
    gameId: event.categoryId,
  });

  log.info({
    user: "EventSub",
    message: `Channel update: ${event.broadcasterDisplayName} - "${event.streamTitle}" | ${event.categoryName}`,
    channel: channel,
  });
}
