import "dotenv/config";

import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

import { initAskowBot, say } from "./twitchbot.js";
import { getChannelInfo } from "./twitchData.js";
import config from "../../config.js";

const app = express();

// init Twitch Bot
initAskowBot();
// getChannelInfo("Askowbol");

app.use(express.json());

const channelId = "44105925"; // Askowbol channelId

// Step 1: Get OAuth Token
// TODO : implement something with expireIn
async function getAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "moderator:read:followers",
    }),
  });
  const data = await response.json();
  return data.access_token;
}

// Step 2: Subscribe to the Event
async function subscribeToChannelFollow(accessToken) {
  const response = await fetch(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "channel.follow",
        version: "2", // Twitch requires version 2 for follow events
        condition: {
          broadcaster_user_id: channelId, // Channel's user ID
          moderator_user_id: channelId, // Required for version 2
        },
        transport: {
          method: "webhook",
          callback: `${process.env.TWITCH_OAUTH_REDIRECT_URL}/webhook`, // public webhook URL
          secret: "YOUR_SECRET_KEY", // TODO: maybe something better
        },
      }),
    },
  );

  const data = await response.json();
  console.log("Subscription response:", data);
}

app.post("/webhook", (req, res) => {
  const message =
    req.headers["twitch-eventsub-message-id"] +
    req.headers["twitch-eventsub-message-timestamp"] +
    JSON.stringify(req.body);
  const hmac = `sha256=${crypto.createHmac("sha256", "YOUR_SECRET_KEY").update(message).digest("hex")}`;

  // Verify the request
  if (req.headers["twitch-eventsub-message-signature"] !== hmac) {
    console.log("Invalid signature");
    return res.status(403).send("Forbidden");
  }

  // Handle Twitch event
  const event = req.body.event;

  if (
    req.headers["twitch-eventsub-message-type"] ===
    "webhook_callback_verification"
  ) {
    // Respond to Twitch's verification challenge
    console.log("Verifying webhook");
    return res.send(req.body.challenge);
  } else if (event) {
    if (req.body.subscription.type === "channel.follow") {
      console.log(
        `New follow detected! ${event.user_name} followed ${event.broadcaster_user_name}`,
      );
      // You can trigger alert, say something to channel
      say("#askowbol", event.user_name);
    }
  }

  res.status(200).send();
});

app.get("/test-follow", (req, res) => {
  console.log("Simulating a follow event...");
  const simulatedFollow = {
    user_name: "TestFollower",
    broadcaster_user_name: "YourChannel",
  };
  console.log(
    `New follow detected! ${simulatedFollow.user_name} followed ${simulatedFollow.broadcaster_user_name}`,
  );
  res.send("Follow event simulated!");
});

// Start the Express server
app.listen(config.port, async () => {
  console.log(`Listening on port ${config.port}`);
  const accessToken = await getAccessToken();
  await subscribeToChannelFollow(accessToken);
  console.log("Follow event subscription set up");
});

app.get("/", (req, res) => {
  res.send(`wub wub`);
});
