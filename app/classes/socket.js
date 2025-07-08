import { Server as SocketIOServer } from "socket.io";

let instance = null;
export default class Socket {
  constructor({ server, chatBot, voice }) {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    // Setup
    this.isOBS = false;
    this.chatBot = chatBot;
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
    this.initChatBotEvents();
  }

  initIOEvents() {
    this.io.on("connection", (socket) => {
      this.isOBS = socket.handshake.query.isOBS === "true";
      if (this.isOBS) {
        console.log("New client connected running on OBS");
      } else {
        console.log("New client connected");
      }

      // Inform the Chat Bot about OBS status (static during runtime)
      this.chatBot.setIsOBS(this.isOBS);

      // Send current chat history to the connected client
      socket.emit("chat-history", this.chatHistory);

      socket.on("disconnect", () => {
        console.log("Client disconnected");
        this.chatBot.setIsOBS(false);
      });
    });
  }

  initChatBotEvents() {
    // Handle chat messages (both user messages and bot responses)
    this.chatBot.on("bot-chat", (data) => {
      this.chatHistory.push(data);

      this.io.emit("chat-history", this.chatHistory);
    });

    // Handle bot responses for voice synthesis
    this.chatBot.on("bot-response", async (data) => {
      if (data.channel === "askowbol") {
        const audioBuffer = await this.voice.convertAsStream({
          text: data.response.message,
          emotion: data.response.emotion,
        });

        this.io.emit("audio-voice", {
          channel: data.channel,
          content: data.response,
          audioBuffer: audioBuffer ? audioBuffer.toString("base64") : null,
        });
      }
    });
  }
}
