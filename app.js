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
import { setupDatabase } from "./app/database/index.js";

// Twitch flow
import { oAuthTokenMiddleWare } from "./app/twitch/oauth-token-middleware.js";
import { eventSubMiddleware } from "./app/twitch/eventsub-middleware.js";
import { cleanupEventSubSubscriptions } from "./app/twitch/eventsub-setup.js";
import chatBot from "./app/twitch/chat-bot.js";

// Discord
import discordBot from "./app/discord/discord-bot.js";

// Services
import askobot from "./app/services/askobot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Serve static files from the front-end build directory
  const distPath = path.join(__dirname, "..", "front", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  const server = http.createServer(app);

  server.listen(process.env["APP_PORT"], () => {
    console.log(`Askobot Front End is running at ${process.env["APP_URL"]}`);
  });

  // Route for serving the index.html
  app.get("/", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Route for oAuth token
  app.post("/oauth-token", oAuthTokenMiddleWare);

  // Route for EventSub webhooks
  app.post("/eventsub", eventSubMiddleware);

  // EventSub manual cleanup
  // await cleanupEventSubSubscriptions();

  // init Socket IO Server
  const socket = new Socket({ server, chatBot, voice, askobot });
}

startServer();
