import "dotenv/config";
import config from "./config.json" with { type: "json" };
import express from "express";
import TwitchBot from "./twitchBot.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const twitchBot = new TwitchBot();
twitchBot.connect();
const chatHistory = [];

twitchBot.on("chat", (question, answer) => {
  chatHistory.push({ question, answer });
  io.emit("history", chatHistory);
});

const app = express();

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

app.get("/", (req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>Chat History</title>
      </head>
      <body>
        <h1>Chat History</h1>
        <ul id="chat"></ul>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          var socket = io();
          socket.on('history', function(history) {
            var chatUl = document.getElementById('chat');
            chatUl.innerHTML = '';
            history.forEach(function(item) {
              var li = document.createElement('li');
              li.textContent = 'Q: ' + item.question + ' - A: ' + item.answer;
              chatUl.appendChild(li);
            });
          });
        </script>
      </body>
    </html>
  `);
});
