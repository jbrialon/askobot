import "dotenv/config";
import express from "express";
import os from "os";
import config from "./config.json" with { type: "json" };
import { initAskowBot } from "./twitchbot.js";
import { getCurrentTimeOfDay, log } from"./utils/utils.js";

const app = express();

const hostname = os.hostname();

const timeOfDay = getCurrentTimeOfDay();

app.get("/", (req, res) => {
  res.send(`Hello, i'm Askowbot!, The time of day is: ${timeOfDay}`);
});

app.listen(config.port, () => {
  log('server', hostname, `🚀 Askowbot Launch success 🚀`);
});

// init Twitch Bot
initAskowBot();
