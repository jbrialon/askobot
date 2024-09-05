import tmi from "tmi.js";
import OpenAI from "openai";
import os from "os";

import { log } from "./utils/utils.js";
import { fetchLeaderboardData } from "./battleground.js";
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

client.on("message", (channel, tags, message, self) => {
  const user = tags.username;
  const displayUserName = tags["display-name"];
  const isNotBot =
    tags.username.toLowerCase() !==
    process.env.TWITCH_BOT_USERNAME.toLowerCase();

  if (self || (!message.startsWith("!") && isNotBot)) return;

  const args = message.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  if (command === "bgrank") {
    (async () => {
      try {
        const player = await fetchLeaderboardData(args);

        if (player) {
          const rankEmojis = {
            1: "🥇",
            2: "🥈",
            3: "🥉",
            4: "🍫",
          };
          let emoji = rankEmojis[player.rank] || "🤖";
          const message = `${emoji} ${player.accountid} : ${player.rank} ${emoji}`;
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

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemContent,
      },
      { role: "user", content: message },
    ],
    model: "gpt-3.5-turbo",
    stream: false,
  });
  const content = completion.choices[0].message.content;
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
