import { test } from "node:test";
import assert from "node:assert";
import "dotenv/config";

import askOS from "../../dist/app/core/askOS.js";

test("AskOS generates response with history", async () => {
  const response = await askOS.generateResponse({
    channel: "askowbol",
    user: "TestUser",
    message: "De quelle couleur est Filou?",
    platform: "twitch",
    history: [
      {
        role: "user",
        content: "[TWITCH] @TestUser: Filou est un chat blanc au yeux bleu",
      },
      {
        role: "assistant",
        content: "Filou a l'air d'être un magnifique chat! Les chats blancs aux yeux bleus sont vraiment splendides.",
      },
    ],
  });

  assert.ok(response.message, "Response should have a message");
  assert.ok(response.emotion, "Response should have an emotion");
  assert.ok(response.animation, "Response should have an animation");
  console.log("Response:", response);
});

test("AskOS generates response without history", async () => {
  const response = await askOS.generateResponse({
    channel: "askowbol",
    user: "AnotherUser",
    message: "Raconte-moi une blague!",
    platform: "twitch",
  });

  assert.ok(response.message, "Response should have a message");
  assert.ok(response.emotion, "Response should have an emotion");
  assert.ok(response.animation, "Response should have an animation");
  console.log("Response:", response);
});

test("AskOS generates response for Discord platform", async () => {
  const response = await askOS.generateResponse({
    channel: "askowbol",
    user: "DiscordUser",
    message: "Qu'est-ce que tu peux faire?",
    platform: "discord",
  });

  assert.ok(response.message, "Response should have a message");
  assert.ok(response.emotion, "Response should have an emotion");
  assert.ok(response.animation, "Response should have an animation");
  console.log("Response:", response);
});

test("AskOS throws error for invalid channel", async () => {
  await assert.rejects(
    async () => {
      await askOS.generateResponse({
        channel: "nonexistent_channel",
        user: "TestUser",
        message: "Hello",
        platform: "twitch",
      });
    },
    {
      message: /Channel configuration not found/,
    },
  );
});
