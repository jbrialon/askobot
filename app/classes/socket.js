import { Server as SocketIOServer } from "socket.io";
import { log } from "../utils/utils.js";

let instance = null;
export default class Socket {
  constructor({ server, chatBot, voice, askobot }) {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    // Setup
    this.isOBS = false;
    this.chatBot = chatBot;
    this.voice = voice;
    this.askobot = askobot;
    this.chatHistory = new Map();
    this.channelConnections = new Map();

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
    this.initAskobotEvents();
  }

  initIOEvents() {
    this.io.on("connection", (socket) => {
      const isOBS = socket.handshake.query.isOBS === "true";
      const channel = socket.handshake.query.channel;

      if (channel) {
        // Join the socket to the room named after the channel
        socket.join(channel);
        log.info({
          user: "Socket",
          message: `Client joined channel: ${channel}, OBS Status: ${isOBS}`,
          channel: channel,
        });

        // track the channel connections and if it's running on OBS
        this.addChannelConnection(channel, isOBS);

        socket.channel = channel;
        socket.isOBS = isOBS;
      }

      // Send current chat history to the connected client
      const chatHistory = this.getChatHistory(channel);
      socket.emit("chat-history", chatHistory);

      socket.on("disconnect", () => {
        log.info({
          user: "Socket",
          message: `Client disconnected from channel: ${channel}`,
          channel,
        });

        // remove the channel connection
        if (socket.channel) {
          socket.leave(socket.channel);
          this.removeChannelConnection(socket.channel, socket.isOBS);
        }
      });
    });
  }

  initChatBotEvents() {
    // Handle chat messages (both user messages and bot responses)
    this.chatBot.on("chat", (data) => {
      const { channel, response } = data;
      this.addToChatHistory(data.channel, data);
      const chatHistory = this.getChatHistory(data.channel);
      this.io.to(data.channel).emit("chat-history", chatHistory);
    });
  }

  initAskobotEvents() {
    // Handle askobot responses from EventSub events
    this.askobot.on("response", async (data) => {
      const { channel, response } = data;

      // Generate voice if OBS is connected
      // trying to limit the number of requests to the ElevenLabs API
      if (this.channelHasOBS(channel)) {
        const audioBuffer = await this.voice.convertAsStream({
          text: response.message,
          emotion: response.emotion,
        });

        // we say it here so it's in sync with the audio generation
        this.chatBot.say(channel, response);

        this.io.to(channel).emit("audio-voice", {
          channel: channel,
          content: response,
          audioBuffer: audioBuffer ? audioBuffer.toString("base64") : null,
        });

        log.info({
          user: "Socket",
          message: `audio generation for channel ${channel} since it's on OBS`,
          channel: channel,
        });
      } else {
        log.info({
          user: "Socket",
          message: `no audio generation for channel ${channel} since it's not on OBS`,
          channel: channel,
        });
        // we say it here, even if no audio was generated it's still outputing in the chat
        this.chatBot.say(channel, response);
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

    log.info({
      user: "Socket",
      message: `Channel ${channel}: ${existing?.socketCount || 1} connections, OBS: ${this.channelConnections.get(channel).hasOBS}`,
      channel: channel,
    });
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
        log.info({
          user: "Socket",
          message: `Channel ${channel} disconnected`,
          channel: channel,
        });
      } else {
        log.info({
          user: "Socket",
          message: `Channel ${channel}: ${existing.socketCount} connections remaining`,
          channel: channel,
        });
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
