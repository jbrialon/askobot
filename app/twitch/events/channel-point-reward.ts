import { log } from "../../utils/log.js";
import askobot from "../../services/askobot.ts";
import { EventSubChannelRedemptionAddEvent } from "@twurple/eventsub-base";

export async function handleChannelPointReward(event: EventSubChannelRedemptionAddEvent) {
  const channel = event.broadcasterName.toLowerCase() === "testbroadcaster" ? "askowbol" : event.broadcasterName.toLowerCase();

  const rewardTitle = event.rewardTitle;
  const userName = event.userName;
  const userInput = event.input;
  const cost = event.rewardCost;

  // Handle different reward types based on title
  switch (rewardTitle?.toLowerCase()) {
    case "looping":
      log.info({
        user: "EventSub",
        message: `${rewardTitle} ${cost}: ${userName} requested animation: "${userInput}"`,
        channel: channel,
      });
      // TODO: Integrate with frontend robot animations
      break;

    case "askobot":
    case "askowbot":
      log.info({
        user: "EventSub",
        message: `${rewardTitle} ${cost}: ${userName} asked: "${userInput}"`,
        channel: channel,
      });

      const result = await askobot.generateResponse(channel, userName, userInput);
      // Emit the response for voice synthesis and frontend
      askobot.emit("response", {
        channel: channel,
        response: result,
      });
      break;

    default:
      console.log(`Unknown reward type: ${rewardTitle}`);
      break;
  }
}
