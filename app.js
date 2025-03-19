import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import config from "./config.json" with { type: "json" };
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
  const audioBuffer = await voice.convertAsStream(data.content);
  io.emit("voice-data", {
    channel: data.channel,
    content: data.content,
    audioBuffer: audioBuffer.toString("base64"),
  });
});

const app = express();

// Serve static files from the front-end build directory
const distPath = path.join(__dirname, "front", "dist");
app.use(express.static(distPath));

const server = http.createServer(app);
const io = new SocketIOServer(server);

io.on("connection", (socket) => {
  console.log("New client connected");

  // Send current chat history to the connected client
  socket.emit("history", chatHistory);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
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
