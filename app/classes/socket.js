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

    // setup
    this.chatHistory = new Map();
    this.channelConnections = new Map();
  }

  initIOEvents() {
    this.io.on("connection", (socket) => {
      const isOBS = socket.handshake.query.isOBS === "true";
      const channel = socket.handshake.query.channel;
      if (isOBS) {
        console.log("New client connected running on OBS");
      } else {
        console.log("New client connected");
      }

      if (channel) {
        // Join the socket to the room named after the channel
        socket.join(channel);
        console.log(`Client joined channel: ${channel}`);

        // track the channel connections and if it has OBS
        this.addChannelConnection(channel, isOBS);

        socket.channel = channel;
        socket.isOBS = isOBS;
      }

      // Send current chat history to the connected client
      const chatHistory = this.getChatHistory(channel);
      socket.emit("chat-history", chatHistory);

      socket.on("disconnect", () => {
        console.log("Client disconnected");

        // remove the channel connection
        if (socket.channel) {
          this.removeChannelConnection(socket.channel, socket.isOBS);
        }
      });
    });
  }

  initChatBotEvents() {
    // Handle chat messages (both user messages and bot responses)
    this.chatBot.on("bot-chat", (data) => {
      this.addToChatHistory(data.channel, data);
      const chatHistory = this.getChatHistory(data.channel);

      this.io.to(data.channel).emit("chat-history", chatHistory);
    });

    // Handle bot responses for voice synthesis, trying to limit the number of requests to the ElevenLabs API
    this.chatBot.on("bot-response", async (data) => {
      if (this.channelHasOBS(data.channel)) {
        const audioBuffer = await this.voice.convertAsStream({
          text: data.response.message,
          emotion: data.response.emotion,
        });

        this.io.to(data.channel).emit("audio-voice", {
          channel: data.channel,
          content: data.response,
          audioBuffer: audioBuffer ? audioBuffer.toString("base64") : null,
        });
      } else {
        console.log(`no audio generation for channel ${data.channel} since it's not on OBS`);
      }
    });
  }

  addChannelConnection(channel, isOBS) {
    const existing = this.channelConnections.get(channel);

    if (existing) {
      existing.socketCount++;
      existing.hasOBS = existing.hasOBS || isOBS;
    } else {
      this.channelConnections.set(channel, {
        socketCount: 1,
        hasOBS: isOBS,
      });
    }

    console.log(`Channel ${channel}: ${existing?.socketCount || 1} connections, OBS: ${this.channelConnections.get(channel).hasOBS}`);
  }

  removeChannelConnection(channel, wasOBS) {
    const existing = this.channelConnections.get(channel);

    if (existing) {
      existing.socketCount--;

      if (wasOBS) {
        existing.hasOBS = false;
      }

      if (existing.socketCount <= 0) {
        this.channelConnections.delete(channel);
        console.log(`Channel ${channel} disconnected`);
      } else {
        console.log(`Channel ${channel}: ${existing.socketCount} connections remaining`);
      }
    }
  }

  channelHasOBS(channel) {
    return this.channelConnections.get(channel)?.hasOBS || false;
  }

  getChatHistory(channel) {
    if (!this.chatHistory.has(channel)) {
      this.chatHistory.set(channel, []);
    }
    return this.chatHistory.get(channel);
  }

  addToChatHistory(channel, message) {
    const history = this.getChatHistory(channel);
    history.push(message);

    // Keep last 10 messages per channel
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }
}
