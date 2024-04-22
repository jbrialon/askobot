import tmi from "tmi.js";
import OpenAI from "openai";

import { log } from "./utils/utils.js";
// const { fetchLeaderboardData } = require("./battleground.js");
import config from "./config.json" with { type: "json" };

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
  const isNotBot =
    tags.username.toLowerCase() !==
    process.env.TWITCH_BOT_USERNAME.toLowerCase();

  if (self || (!message.startsWith("!") && isNotBot)) return;

  const args = message.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  // if (command === "bgrank") {
  //   (async () => {
  //     try {
  //       const data = await fetchLeaderboardData(args);

  //       const message = data ? `${args[0]} : ${data}` : "non trouvé :(";
  //       client.say(channel, message);
  //     } catch (error) {
  //       console.error("Error fetching leaderboard data:", error);
  //     }
  //   })();
  // }

  if (command === "askowbot") {
    askGPT(channel, args, user);
  }
});

const askGPT = async (channel, question, user) => {
  const systemContent = config.context[channel];
  const message = `je suis ${user} et voici ma ${question}`;

  logToDiscord(channel, user, `${question}`);

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
};

export { initAskowBot };
