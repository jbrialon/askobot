import tmi from "tmi.js";
import OpenAI from "openai";
import os from "os";

import { log, getFrenchOrdinal, cleanText } from "./utils/utils.js";
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
  channels: config.channels,
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

    // TODO: Should be in config maybe
    const battleTagByChannel = {
      "#askowbol": "Askow",
      "#lbineau": "lbineau",
      "#slyders_hs": "Slyders",
      "#veluxdeluxe": "Velux",
      "#yanousama": "yanousama",
      "#cytro97": "Cytro",
      "#spidy_hs": "Spidy",
    };

    (async () => {
      try {
        if (!args || args.length === 0) {
          // if not parameter is provided, we want the ranking of the stramer
          console.log(channel, battleTagByChannel[channel]);
          args[0] = battleTagByChannel[channel];
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
            player.rank
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
    const message = `je suis ${displayUserName} et voici ma ${question}`;

    askGPT(channel, message);
    logToDiscord(channel, user, `${question}`);
  }
});

const askGPT = async (channel, message) => {
  const contexts = config.context[channel];
  const systemContent = contexts[Math.floor(Math.random() * contexts.length)];
  let content;

  const tools = [
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
          },
          required: ["card_name"],
          additionalProperties: false,
        },
      },
    },
    // {
    //   type: "function",
    //   function: {
    //     name: "get_hero_info",
    //     description:
    //       "Fetch Hearthstone Battlegrounds hero details. Use this tool when a user asks about a specific hero.",
    //     parameters: {
    //       type: "object",
    //       properties: {
    //         hero_name: {
    //           type: "string",
    //           description:
    //             "The name of the Hearthstone Battlegrounds hero to fetch information about.",
    //         },
    //       },
    //       required: ["hero_name"],
    //       additionalProperties: false,
    //     },
    //   },
    // },
  ];

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: message },
      ],
      model: "gpt-4o-mini",
      tools,
    });

    if (response.choices[0].finish_reason === "tool_calls") {
      const functionCall = response.choices[0].message.tool_calls[0].function;
      if (functionCall.name === "get_card_info") {
        const cardName = JSON.parse(functionCall.arguments).card_name;
        const cardData = await fetchCardData(cardName);
        if (cardData) {
          content = `${cardData.name}: ${cleanText(cardData.text)}`;
        } else {
          content = "Aucune carte trouvée portant ce nom 🤔";
        }
      }
      // else if (functionCall.name === "get_hero_info") {
      //   const heroName = JSON.parse(functionCall.arguments).hero_name;
      //   const heroData = await fetchHeroData(heroName);
      //   content = heroData;
      // }
    } else {
      content = response.choices[0].message.content;
    }
  } catch (error) {
    content = "<Error.01.beep.boop>";
  }

  logToDiscord(channel, "Askowbot", content);
  client.say(channel, `🤖 ${content} 🤖`);
};

const fetchHeroData = async (heroName) => {
  try {
    return `${heroName} TODO fetch hero Data`;
  } catch (error) {
    console.error("Error fetching Hearthstone Battlegrounds heroes:", error);
    return null;
  }
};

const logToDiscord = (channel, user, message) => {
  log(channel, user, message);
};

const initAskowBot = () => {
  client.connect();
  log("server", hostname, `🚀 Askowbot Launch success 🚀`);
};

export { initAskowBot };
