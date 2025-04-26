import { Server as SocketIOServer } from "socket.io";

let instance = null;
export default class Socket {
  constructor({ server, twitchBot, voice }) {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    // Setup
    this.isOBS = false;
    this.twitchBot = twitchBot;
    this.voice = voice;
    this.chatHistory = [];

    // init Socket.IO
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // init Events
    this.initIOEvents();
    this.initTwichBotEvents();
  }

  initIOEvents() {
    this.io.on("connection", (socket) => {
      this.isOBS = socket.handshake.query.isOBS === "true";
      if (this.isOBS) {
        console.log("New client connected running on OBS");
      } else {
        console.log("New client connected");
      }

      // Send current chat history to the connected client
      socket.emit("chat-history", this.chatHistory);

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });

      socket.on("bot-askAskobot", (user, message) => {
        this.twitchBot.askAskobot("#askowbol", user, message);
      });
    });
  }

  initTwichBotEvents() {
    this.twitchBot.on("bot-chat", (data) => {
      this.chatHistory.push(data);
      this.io.emit("chat-history", this.chatHistory);
    });

    this.twitchBot.on("bot-voice", async (data) => {
      if (data.channel === "#askowbol") {
        const audioBuffer = await this.voice.convertAsStream({
          text: data.result.response,
          emotion: data.result.emotion,
        });

        this.io.emit("audio-voice", {
          channel: data.channel,
          content: data.result,
          audioBuffer: audioBuffer ? audioBuffer.toString("base64") : null,
          user: data.user,
        });
      }
    });
  }
}
