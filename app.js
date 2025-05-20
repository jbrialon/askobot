import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import http from "http";
import { fileURLToPath } from "url";

// Classes
import Socket from "./app/classes/socket.js";
import Voice from "./app/classes/voice.js";
import TwitchBot from "./app/classes/twitch-bot.js";

// Config
import config from "./config.js";

// Database
import { setupDatabase } from "./app/database/index.js";

// New Twitch flow
import { oAuthTokenMiddleWare } from "./app/twitch/oauth-token-middleware.js";
import { startChatBot } from "./app/twitch/chat-bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await setupDatabase();

  const twitchBot = new TwitchBot();
  const voice = new Voice();

  // init express server
  const app = express();
  app.use(express.json());

  if (process.env.APP_ENV === "development") {
    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );
  }

  // Serve static files from the front-end build directory
  const distPath = path.join(__dirname, "..", "front", "dist");
  app.use(express.static(distPath));
  const server = http.createServer(app);

  server.listen(process.env.APP_PORT, () => {
    console.log(`Askobot Front End is running at http://localhost:${process.env.APP_PORT}`);
  });

  // Route for serving the index.html
  app.get("/", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.post("/oauth-token", oAuthTokenMiddleWare);

  // init Socket IO Server
  new Socket({ server, twitchBot, voice });

  // New Twitch flow
  startChatBot();
}

startServer();
