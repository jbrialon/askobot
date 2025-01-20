import tmi from "tmi.js";
import OpenAI from "openai";
import os from "os";

import { log, getFrenchOrdinal } from "./utils/utils.js";
import { fetchCardData, fetchLeaderboardData } from "./battleground.js";
import config from "./config.json" with { type: "json" };

const hostname = os.hostname();
const openai = new OpenAI({
  organization: process.env.ORGKEY,
  apiKey: process.env.APIKEY,
});

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: "Askowbot",
    password: `oauth:${process.env.TWITCH_OAUTH}`,
  },
  channels: config.channels.map((channel) => channel.twitchChannel.slice(1)),
});

// Cooldown threshold in milliseconds
const COMMAND_COOLDOWN = config.commandCooldown * 60 * 1000;
const lastCommandTime = {};

client.on("message", (channel, tags, message, self) => {
  const user = tags.username;
  const displayUserName = tags["display-name"];
  // const isSub = tags.subscriber;

  const isNotBot =
    tags.username.toLowerCase() !==
    process.env.TWITCH_BOT_USERNAME.toLowerCase();

  if (self || (!message.startsWith("!") && isNotBot)) return;

  const args = message.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  if (command === "bgrank" || command === "bgrankduo") {
    const currentTime = Date.now();
    const isDuo = command === "bgrankduo";

    // Check if the cooldown has expired
    if (
      lastCommandTime[channel] &&
      currentTime - lastCommandTime[channel] < COMMAND_COOLDOWN
    ) {
      // client.say(channel, `⏳ Commande en cooldown! Veuillez patienter encore un peu. ⏳`);
      return;
    }
    lastCommandTime[channel] = currentTime;

    (async () => {
      try {
        if (!args || args.length === 0) {
          // if not parameter is provided, we want the ranking of the stramer
          args[0] = config.channels.find(
            (c) => c.twitchChannel === channel,
          ).battletag;
        }

        const player = await fetchLeaderboardData(args, isDuo);

        if (player) {
          const rankEmojis = {
            1: "🥇",
            2: "🥈",
            3: "🥉",
            4: "🍫",
          };
          let emoji = rankEmojis[player.rank] || "🤖";
          const message = `${emoji} ${player.accountid} : ${getFrenchOrdinal(
            player.rank,
          )} (${player.rating}) ${isDuo ? "(duo)" : ""} ${emoji}  [📛⏳ ${
            config.commandCooldown
          }m]`;
          client.say(channel, message);
        } else {
          const message = `invente un message comme quoi le joueur ${args[0]} n'a pas été trouvé dans le classement`;
          askGPT(channel, message);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    })();
  }

  if (command === "askowbot" || command === "askobot") {
    const question = args.join(" ");
    const message = `je suis ${displayUserName} et voici ma question: "${question}"`;

    askGPT(channel, message);
    logToDiscord(channel, user, `${question}`);
  }
});

const askGPT = async (channel, message) => {
  const contexts = config.channels.find(
    (c) => c.twitchChannel === channel,
  ).context;
  const systemContent = contexts[Math.floor(Math.random() * contexts.length)];
  let content;

  const cardTools = [
    {
      type: "function",
      function: {
        name: "get_card_info",
        description:
          "Fetch Hearthstone Battlegrounds card details. Use this tool when a user asks about a specific card.",
        parameters: {
          type: "object",
          properties: {
            card_name: {
              type: "string",
              description:
                "The name of the Hearthstone Battlegrounds card to fetch information about.",
            },
            golden: {
              type: "boolean",
              description:
                "Whether to fetch information about the golden version of the card.",
            },
          },
          required: ["card_name"],
          additionalProperties: false,
        },
      },
    },
  ];

  const heroTools = [
    {
      type: "function",
      function: {
        name: "get_hero_power_info",
        description:
          "Fetch the hero power of a specific Hearthstone Battlegrounds hero. This function should only be used when the user asks specifically about the hero power (hp) of the hero, nothing else.",
        parameters: {
          type: "object",
          properties: {
            hero_name: {
              type: "string",
              description:
                "The name of the Hearthstone Battlegrounds hero to fetch the hero power information for.",
            },
          },
          required: ["hero_name"],
          additionalProperties: false,
        },
      },
    },
  ];

  try {
    const payload = {
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: message },
      ],
      model: "gpt-4o-mini",
    };

    if (config.gptCardTriggerWords.some((word) => message.includes(word))) {
      payload.tools = cardTools;
    } else if (
      config.gptHeroTriggerWords.some((word) => message.includes(word))
    ) {
      payload.tools = heroTools;
    }

    const response = await openai.chat.completions.create(payload);

    if (response.choices[0].finish_reason === "tool_calls") {
      const functionCall = response.choices[0].message.tool_calls[0].function;
      if (functionCall.name === "get_card_info") {
        const { card_name: cardName, golden } = JSON.parse(
          functionCall.arguments,
        );
        const cardData = fetchCardData(cardName, false);
        if (cardData) {
          content = `${cardData.name.fr}: ${
            golden ? cardData.upgradeText : cardData.text
          } `;
        } else {
          content = "Aucune carte trouvée portant ce nom 🤔";
        }
      } else if (functionCall.name === "get_hero_power_info") {
        const heroName = JSON.parse(functionCall.arguments).hero_name;
        const heroData = fetchCardData(heroName, true);
        if (heroData) {
          content = `${heroData.name.fr}: ${heroData.text} `;
        } else {
          content = "Aucun hero trouvé portant ce nom 🤔";
        }
      }
    } else {
      content = response.choices[0].message.content;
    }
  } catch (error) {
    console.log(error);
    content = "<Error.01.beep.boop>";
  }

  logToDiscord(channel, "Askowbot", content);
  client.say(channel, `🤖 ${content} 🤖`);
};

const logToDiscord = (channel, user, message) => {
  log(channel, user, message);
};

const initAskowBot = () => {
  client.connect();
  log("server", hostname, `🚀 Askowbot Launch success 🚀`);
};

export { initAskowBot };
