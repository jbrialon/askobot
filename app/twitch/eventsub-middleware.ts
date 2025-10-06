import { Request, Response } from "express";
import { log } from "../utils/log.js";
import crypto from "crypto";

import { handleStreamOnline } from "./events/stream-online.js";
import { handleStreamOffline } from "./events/stream-offline.js";
import { handleChannelPointReward } from "./events/channel-point-reward.js";

interface EventSubEvent {
  subscription: {
    id: string;
    type: string;
    version: string;
    condition: any;
    transport: {
      method: string;
      callback: string;
    };
    created_at: string;
  };
  event?: any;
  challenge?: string;
}

interface EventSubRequest extends Request {
  body: EventSubEvent;
}

export async function eventSubMiddleware(req: EventSubRequest, res: Response) {
  try {
    const messageId = req.headers["twitch-eventsub-message-id"] as string;
    const messageTimestamp = req.headers["twitch-eventsub-message-timestamp"] as string;
    const messageSignature = req.headers["twitch-eventsub-message-signature"] as string;
    const messageType = req.headers["twitch-eventsub-message-type"] as string;

    // Verify the message signature if we have a webhook secret
    if (process.env["TWITCH_EVENTSUB_SECRET"]) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env["TWITCH_EVENTSUB_SECRET"])
        .update(messageId + messageTimestamp + JSON.stringify(req.body))
        .digest("hex");

      const providedSignature = messageSignature?.replace("sha256=", "");

      if (expectedSignature !== providedSignature) {
        console.error("EventSub signature verification failed");
        res.status(403).send("Forbidden");
        return;
      }
    }

    console.log(`EventSub ${messageType} received:`, {
      messageId,
      messageType,
      subscriptionType: req.body.subscription?.type,
      subscriptionId: req.body.subscription?.id,
    });

    // Handle webhook verification challenge
    if (messageType === "webhook_callback_verification") {
      console.log("EventSub webhook verification challenge received");
      res.status(200).send(req.body.challenge);
      return;
    }

    // Handle subscription revocation
    if (messageType === "revocation") {
      console.log("EventSub subscription revoked:", req.body.subscription);
      res.status(204).send();
      return;
    }

    // Handle notification events
    if (messageType === "notification") {
      console.log("EventSub notification received:", {
        type: req.body.subscription.type,
        event: req.body.event,
      });

      // Process the event based on subscription type
      await handleEventSubNotification(req.body);

      res.status(204).send();
      return;
    }

    console.warn("Unknown EventSub message type:", messageType);
    res.status(204).send();
  } catch (error) {
    console.error("Error processing EventSub webhook:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function handleEventSubNotification(eventData: EventSubEvent) {
  const subscriptionType = eventData.subscription.type;
  const event = eventData.event;
  const channel = event?.broadcaster_user_name || event?.broadcaster_user_login;

  switch (subscriptionType) {
    case "channel.follow":
      log.info({
        user: "EventSub",
        message: `Follow: ${event?.user_name}`,
        channel: channel,
      });
      break;

    case "channel.subscribe":
      log.info({
        user: "EventSub",
        message: `Subscribe: ${event?.user_name}`,
        channel: channel,
      });
      break;

    case "channel.subscription.gift":
      log.info({
        user: "EventSub",
        message: `Gift subscription: ${event?.user_name} gifted ${event?.total}`,
        channel: channel,
      });
      break;

    case "channel.cheer":
      log.info({
        user: "EventSub",
        message: `Cheer: ${event?.user_name} cheered ${event?.bits} bits`,
        channel: channel,
      });
      break;

    case "channel.raid":
      log.info({
        user: "EventSub",
        message: `Raid: ${event?.from_broadcaster_user_name} with ${event?.viewers} viewers`,
        channel: channel,
      });
      break;

    case "stream.online":
      await handleStreamOnline(event);
      break;

    case "stream.offline":
      await handleStreamOffline(event);
      break;

    case "channel.channel_points_custom_reward_redemption.add":
      await handleChannelPointReward(event);
      break;

    case "channel.channel_points_custom_reward_redemption.update":
      log.info({
        user: "EventSub",
        message: `Reward update: ${event?.user_name} - ${event?.reward?.title} (${event?.status})`,
        channel: channel,
      });
      break;

    default:
      log.info({
        user: "EventSub",
        message: `Unhandled notification type: ${subscriptionType}`,
        channel: channel,
      });
      break;
  }
}
