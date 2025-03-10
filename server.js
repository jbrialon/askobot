import "dotenv/config";
import config from "./config.json" with { type: "json" };
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import TwitchBot from "./twitchBot.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const twitchBot = new TwitchBot();
twitchBot.connect();
const chatHistory = [];

twitchBot.on("chat", (data) => {
  chatHistory.push(data);
  io.emit("history", chatHistory);
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
