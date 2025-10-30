import { log } from "../../utils/log.js";
import askobot from "../../services/askobot.ts";

export async function handleChannelPointReward(event: any) {
  const broadcasterLogin = event.broadcaster_user_login.toLowerCase() || event.broadcaster_user_name?.toLowerCase();
  const channel = broadcasterLogin === "testbroadcaster" ? "askowbol" : broadcasterLogin;

  if (!channel) {
    console.error("[channel-point-reward] No broadcaster information in event:", event);
    return;
  }

  const rewardTitle = event.reward?.title;
  const userName = event.user_name;
  const userInput = event.user_input;
  const cost = event.reward?.cost;

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
