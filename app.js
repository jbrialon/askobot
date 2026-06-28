import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import http from "http";
import { fileURLToPath } from "url";

// Classes
import Socket from "./app/classes/socket.js";
import voice from "./app/classes/voice.js";

// Database
import { setupDatabase } from "./app/database/index.ts";

// Twitch flow
import { initChannelData } from "./app/twitch/channel-data.ts";
import { oAuthTokenMiddleWare } from "./app/twitch/oauth-token-middleware.ts";
import { eventSubMiddleware } from "./app/twitch/eventsub-middleware.ts";
import { cleanupEventSubSubscriptions } from "./app/twitch/eventsub-setup.ts";
import chatBot from "./app/twitch/chat-bot.ts";

// Discord
import discordBot from "./app/discord/discord-bot.ts";

// Services
import askobot from "./app/services/askobot.ts";

// Utils
import { log } from "./app/utils/log.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// if project is running from dist/ or dev mode
const projectRoot = __dirname.endsWith("dist") ? path.join(__dirname, "..") : __dirname;

async function startServer() {
  await setupDatabase();

  // init express server
  const app = express();
  app.use(express.json());

  if (process.env["APP_ENV"] === "development") {
    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );
  }

  // Route for serving Battlegrounds card data
  app.get("/api/cards", (req, res) => {
    res.sendFile(path.join(projectRoot, "db", "cards.json"));
  });

  // Route for oAuth token
  app.post("/oauth-token", oAuthTokenMiddleWare);

  // Route for EventSub webhooks
  app.post("/eventsub", eventSubMiddleware);

  // Serve static files from the front-end build directory
  const distPath = path.join(projectRoot, "front", "dist");
  app.use(express.static(distPath));

  // Catch-all route is last to avoid intercepting API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  const server = http.createServer(app);

  server.listen(process.env["APP_PORT"], () => {
    console.log(`Askobot Front End is running at ${process.env["APP_URL"]}`);
  });

  // EventSub manual cleanup
  // await cleanupEventSubSubscriptions();

  // init Socket IO Server
  const socket = new Socket({ server, chatBot, voice, askobot });

  // Wait for Discord bot to be ready, then log final success message
  discordBot.once("ready", async () => {
    await initChannelData();
    log.success({
      user: "System",
      message: "🚀 Askowbot Launch success 🚀",
      channel: "system",
    });
  });
}

startServer();
