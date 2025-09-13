import "dotenv/config";
import { apiClient } from "./auth-clients.js";
import { log } from "../utils/utils.js";

// const WEBHOOK_URL = `${process.env.TWITCH_OAUTH_REDIRECT_URL}/eventsub`;
const WEBHOOK_URL = `https://askobot.jerem.cool/eventsub`;

const WEBHOOK_SECRET = process.env["TWITCH_EVENTSUB_SECRET"];

if (!WEBHOOK_SECRET) {
  throw new Error("TWITCH_EVENTSUB_SECRET environment variable must be set");
}

export async function setupEventSubSubscriptions() {
  try {
    // Get existing subscriptions to avoid duplicates
    const existingSubscriptions = await apiClient.eventSub.getSubscriptions();
    console.log(`Found ${existingSubscriptions.data.length} existing EventSub subscriptions`);

    // Channels we want to monitor
    // TODO: well this could be better
    const channels = ["askowbol"];

    for (const channelName of channels) {
      try {
        const user = await apiClient.users.getUserByName(channelName);
        if (!user) {
          console.error(`User not found: ${channelName}`);
          continue;
        }

        const broadcasterId = user.id;
        console.log(`Setting up EventSub subscriptions for ${channelName} (${broadcasterId})`);

        const subscriptionTypes = [
          { type: "channel.follow", version: "2" },
          { type: "channel.subscribe", version: "1" },
          { type: "channel.subscription.gift", version: "1" },
          { type: "channel.cheer", version: "1" },
          { type: "channel.raid", version: "1" },
          { type: "stream.online", version: "1" },
          { type: "stream.offline", version: "1" },
          { type: "channel.channel_points_custom_reward_redemption.add", version: "1" },
          { type: "channel.channel_points_custom_reward_redemption.update", version: "1" },
        ];

        for (const subscription of subscriptionTypes) {
          const existingSubscription = existingSubscriptions.data.find((sub) => {
            if (sub.type !== subscription.type) return false;
            if (subscription.type === "channel.raid") {
              return sub.condition["to_broadcaster_user_id"] === broadcasterId;
            }
            return sub.condition["broadcaster_user_id"] === broadcasterId;
          });

          if (existingSubscription) {
            console.log(`Subscription already exists: ${subscription.type} for ${channelName}`);
            continue;
          }

          try {
            // Create the subscription
            let condition: any = { broadcaster_user_id: broadcasterId };

            // Special conditions for different subscription types
            if (subscription.type === "channel.follow") {
              condition.moderator_user_id = broadcasterId;
            } else if (subscription.type === "channel.raid") {
              condition = { to_broadcaster_user_id: broadcasterId };
            }

            const result = await apiClient.eventSub.createSubscription(subscription.type, subscription.version, condition, {
              method: "webhook",
              callback: WEBHOOK_URL,
              secret: WEBHOOK_SECRET!,
            });

            log.info({
              user: "EventSub",
              message: `Created subscription: ${subscription.type} for channel ${channelName}`,
              channel: channelName,
            });

            console.log(`Created subscription: ${subscription.type} for channel ${channelName} (ID: ${result.id})`);
          } catch (error: any) {
            console.error(`Failed to create subscription ${subscription.type} for channel ${channelName}:`, error.message);
          }
        }
      } catch (error: any) {
        console.error(`Failed to setup subscriptions for ${channelName}:`, error.message);
      }
    }

    console.log("EventSub subscription setup completed");
  } catch (error) {
    console.error("Failed to setup EventSub subscriptions:", error);
    throw error;
  }
}

export async function cleanupEventSubSubscriptions() {
  try {
    const subscriptions = await apiClient.eventSub.getSubscriptions();
    console.log(`Found ${subscriptions.data.length} EventSub subscriptions to cleanup`);

    for (const subscription of subscriptions.data) {
      try {
        await apiClient.eventSub.deleteSubscription(subscription.id);
        console.log(`Deleted subscription: ${subscription.type} (ID: ${subscription.id})`);
      } catch (error: any) {
        console.error(`Failed to delete subscription ${subscription.id}:`, error.message);
      }
    }

    console.log("EventSub subscription cleanup completed");
  } catch (error) {
    console.error("Failed to cleanup EventSub subscriptions:", error);
  }
}
