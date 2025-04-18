import "dotenv/config";
import express from "express";
import path from "path";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";

import config from "./config.js";
import Voice from "./app/classes/voice.js";

import TwitchBot from "./app/classes/twitch-bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatHistory = [];

const voice = new Voice();
const twitchBot = new TwitchBot();
twitchBot.connect();

twitchBot.on("chat", (data) => {
  chatHistory.push(data);
  io.emit("history", chatHistory);
});

twitchBot.on("voice", async (data) => {
  if (data.channel === "#askowbol") {
    const audioBuffer = await voice.convertAsStream({
      text: data.result.response,
      emotion: data.result.emotion,
    });

    console.log(data);
    io.emit("voice-data", {
      channel: data.channel,
      content: data.result,
      audioBuffer: audioBuffer.toString("base64"),
      user: data.user,
    });
  }
});

const app = express();

if (process.env.APP_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );
}

// Serve static files from the front-end build directory
const distPath = path.join(__dirname, "front", "dist");
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const isOBS = socket.handshake.query.isOBS === "true";
  if (isOBS) {
    console.log("New client connected running on OBS");
  } else {
    console.log("New client connected");
  }

  // Send current chat history to the connected client
  socket.emit("history", chatHistory);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("ask-askobot", (user, message) => {
    twitchBot.askAskobot("#askowbol", user, message);
  });
});

server.listen(config.port, () => {
  console.log(
    `Askobot Front End is running at http://localhost:${config.port}`,
  );
});

// Route for serving the index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
