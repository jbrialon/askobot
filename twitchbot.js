import tmi from "tmi.js";
import OpenAI from "openai";
import os from "os";

import { log, getFrenchOrdinal } from "./utils/utils.js";
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

// Cooldown threshold in milliseconds
const COMMAND_COOLDOWN = config.commandCooldown * 60 * 1000;
const lastCommandTime = {};

client.on("message", (channel, tags, message, self) => {
  const user = tags.username;
  const displayUserName = tags["display-name"];
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
    if (lastCommandTime[channel] && currentTime - lastCommandTime[channel] < COMMAND_COOLDOWN) {
      // client.say(channel, `⏳ Commande en cooldown ! Veuillez patienter encore un peu. ⏳`);
      return;
    }
    lastCommandTime[channel] = currentTime;

    (async () => {
      try {
        if (!args || args.length === 0 || args[0].toLowerCase() === "askowbot") {
          const message = `invente un message ou tu nous dit quelle position dans le classement du ladder hearthstone battleground tu occupes`;
          askGPT(channel, message);
          return;
        }
        
        // we inform the User we are performing a search
        const search = args[0];
        let message;

        if (!isNaN(search)) {
          // If search is a number
          message = `invente un message ou tu nous dit que tu cherches le ${getFrenchOrdinal(
          parseInt(search, 10)
          )} joueur dans le classement mais que comme il y a bcp de resultats la recherche est longue`;
        } else {
          // If search is a string
          message = `invente un message ou tu nous dit que tu cherches le joueur ${search} dans le classement mais que comme il y a bcp de resultats la recherche est longue`;
        }
        askGPT(channel, message);

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
          )} (${player.rating}) ${isDuo ? '(duo)' : ''} ${emoji}  [📛⏳ ${config.commandCooldown}m]`;
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

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: message },
      ],
      model: "gpt-3.5-turbo",
      stream: false,
    });
    content = completion.choices[0].message.content;
  } catch (error) {
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
