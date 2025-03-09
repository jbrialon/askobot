import "dotenv/config";
import config from "./config.json" with { type: "json" };
import express from "express";
import TwitchBot from "./twitchBot.js";

new TwitchBot().connect();

const app = express();

app.listen(config.port, () => {
  console.log(
    `Askobot Front End is running at http://localhost:${config.port}`,
  );
});

app.get("/", (req, res) => {
  res.send(`wub wub`);
});
