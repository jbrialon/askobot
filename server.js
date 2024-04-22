import "dotenv/config";
import express from "express";
import os from "os";
import config from "./config.json" with { type: "json" };
import { initAskowBot } from "./twitchbot.js";
import { log } from"./utils/utils.js";

const app = express();

const hostname = os.hostname();


app.listen(config.port, () => {
  log('server', hostname, `🚀 Askowbot Launch success 🚀`);
});

// init Twitch Bot
initAskowBot();
