import { log } from "../../utils/log.js";

// TODO: use this to give more context to askobot
export async function handleChannelUpdate(event: any) {
  let channel = event?.broadcaster_user_login?.toLowerCase();

  // Test mode when we are testing from twitch-cli
  if (channel === "testbroadcaster") {
    channel = "askowbol";
  }

  const broadcasterName = event?.broadcaster_user_name;
  const title = event?.title; // Stream title
  const categoryName = event?.category_name; // Game Name
  const categoryId = event?.category_id; // Game/category ID
  const language = event?.language; // Stream language (en, fr...)

  log.info({
    user: "EventSub",
    message: `Channel update: ${broadcasterName} - "${title}" | ${categoryName}`,
    channel: channel,
  });
}
