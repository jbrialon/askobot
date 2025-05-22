import tmi from "tmi.js";
import os from "os";
import { z } from "zod";
import { EventEmitter } from "events";

import { getFrenchOrdinal, log } from "../utils/utils.js";
import { fetchCardData, fetchLeaderboardData } from "../utils/battleground.js";
import { getChannelInfo } from "../utils/twitch-data.js";

import config from "../../config.js";

import { createOpenAI, buildPromptVars } from "../utils/ai-functions.js";
/**
 * TwitchBot handles Twitch chat commands, interacts with OpenAI and manages bot state.
 */
export default class TwitchBot extends EventEmitter {
  /**
   * Constructs a new TwitchBot instance.
   * Initializes configuration, chat history, command registry, and sets up the Twitch client.
   */
  constructor() {
    super();

    // Variables
    this.config = config;
    this.chatHistory = {};
    this.lastCommandTime = {};
    this.hostname = os.hostname();
    this.lastBotActivity = Date.now();
    this.isOBS = false;
    this.idleInterval = null;

    // Setup
    this.openAI = createOpenAI();
    this.client = new tmi.Client({
      options: { debug: true },
      identity: {
        username: "Askowbot",
        password: `oauth:${process.env.TWITCH_OAUTH}`,
      },
      channels: this.config.channels
        .filter((channel) => {
          return process.env.APP_ENV === "development"
            ? channel.twitchChannel === "#askowbol" // Only include #askowbol in development
            : channel.twitchChannel !== "#askowbol"; // Exclude #askowbol in production
        })
        .map((channel) => channel.twitchChannel.slice(1)),
    });

    // Command registry mapping command names to handler methods
    this.commandHandlers = {
      bgrank: this.handleBGRank,
      bgrankduo: this.handleBGRank,
      askowbot: this.handleAskobot,
      askobot: this.handleAskobot,
    };

    // Bind the handleMessage method to ensure correct context
    this.client.on("message", this.handleMessage.bind(this));

    // Init Bot
    this.connect();
    // this.startIdleMonitor();
  }

  setIsOBS(isOBS) {
    console.log("Twitch Bot - Set isOBS to: ", isOBS);
    this.isOBS = isOBS;
  }

  /**
   * Checks whether the given channel is on cooldown.
   * If not, updates the lastCommandTime for the channel.
   *
   * @param {string} channel - The channel name.
   * @returns {boolean} True if the channel is on cooldown; otherwise, false.
   */
  isOnCooldown(channel) {
    const currentTime = Date.now();
    const cooldownTime = this.config.commandCooldown * 60 * 1000;
    if (
      this.lastCommandTime[channel] &&
      currentTime - this.lastCommandTime[channel] < cooldownTime
    ) {
      return true;
    }
    // Update the last command time for the channel
    this.lastCommandTime[channel] = currentTime;
    return false;
  }

  /**
   * Starts monitoring for inactivity in the chat.
   * If no user activity is detected within a set time, it triggers an idle event.
   */
  startIdleMonitor() {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
    }

    this.idleInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - this.lastBotActivity;
      const idleLimit = 2 * 60 * 1000; // 2 minutes TODO -> if the chat is busy increase the value

      if (idleTime >= idleLimit) {
        this.handleIdle();
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stops the idle activity monitor by clearing the active interval.
   */
  stopIdleMonitor() {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  /**
   * Handles the idle event when no activity is detected.
   * Sends a random idle message to the channel.
   */
  async handleIdle() {
    console.log("Twitch Bot : handleIdle Event");
    // ideas
    const randomIdleMessages = [
      "It's quiet in here... anyone want to chat?",
      "Askowbot is bored... ask me a question!",
      "Always here if needed",
      "Who's up for a question?",
    ];

    const randomMessage =
      randomIdleMessages[Math.floor(Math.random() * randomIdleMessages.length)];

    if (this.isOBS) {
      await this.reactToEvent("#askowbol", {
        eventType: "idle",
        // data: { message: randomMessage },
      });
    }

    this.lastBotActivity = Date.now();
  }
  /**
   * Handles incoming chat messages.
   * Parses the command from the message and delegates processing to the appropriate command handler.
   *
   * @param {string} channel - The channel where the message was received.
   * @param {object} tags - Metadata associated with the message (e.g., username).
   * @param {string} message - The content of the chat message.
   * @param {boolean} self - Indicates if the message was sent by the bot itself.
   */
  handleMessage(channel, tags, message, self) {
    const user = tags.username;
    const isNotBot =
      user.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();

    tags.timestamp = Date.now();

    this.emit("bot-chat", {
      channel,
      tags,
      message,
    });

    // if (this.chatters.includes(tags.username) === false) {
    //   this.chatters.push(tags.username);
    //   await this.reactToEvent("#askowbol", {
    //     eventType: "first-message-of-the-day",
    //     data: { username: tags["display-name"] },
    //   });
    // }

    // if (tags["first-msg"] === true && channel === "#askowbol") {
    //   await this.reactToEvent("#askowbol", {
    //     eventType: "first-message",
    //     data: { username: tags["display-name"] },
    //   });
    // }

    // Process messages starting with "!" only
    if (self || (!message.startsWith("!") && isNotBot)) return;

    const args = message.slice(1).split(" ");
    const command = args.shift().toLowerCase();

    if (this.commandHandlers[command]) {
      this.commandHandlers[command].call(this, channel, tags, args, command);
    }
  }

  /**
   * Handles the "bgrank" and "bgrankduo" commands.
   * Retrieves leaderboard data and sends a formatted message back to the Twitch channel.
   *
   * @param {string} channel - The channel where the command was issued.
   * @param {object} tags - Message metadata, including the display name.
   * @param {string[]} args - Command arguments (e.g., battletag).
   * @param {string} command - The command name that triggered this handler.
   */
  async handleBGRank(channel, tags, args, command) {
    const user = {
      name: tags["display-name"],
      color: tags.color,
    };
    const isDuo = command === "bgrankduo";

    // Check for cooldown
    if (this.isOnCooldown(channel)) {
      return;
    }

    try {
      if (!args || args.length === 0) {
        // Use the channel's battletag from config if no parameter provided
        const channelConfig = this.config.channels.find(
          (c) => c.twitchChannel === channel,
        );
        args[0] = channelConfig ? channelConfig.battletag : "";
      }

      const player = await fetchLeaderboardData(args, isDuo);

      if (player) {
        const rankEmojis = {
          1: "🥇",
          2: "🥈",
          3: "🥉",
          4: "🍫",
        };
        const emoji = rankEmojis[player.rank] || "🤖";
        const messageToSend = `${emoji} ${player.accountid} : ${getFrenchOrdinal(
          player.rank,
        )} (${player.rating}) ${isDuo ? "(duo)" : ""} ${emoji}  [📛⏳ ${
          this.config.commandCooldown
        }m]`;
        this.client.say(channel, messageToSend);
      } else {
        const fallbackMessage = `invente un message comme quoi le joueur ${args[0]} n'a pas été trouvé dans le classement`;
        this.askAskobot(channel, user, fallbackMessage);
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
  }

  /**
   * Handles the "askowbot" and "askobot" commands.
   * Forwards the user's question to OpenAI and logs the question.
   *
   * @param {string} channel - The channel where the command was issued.
   * @param {object} tags - Message metadata, including the display name.
   * @param {string[]} args - Command arguments (the user's question).
   * @param {string} command - The command name that triggered this handler.
   */
  async handleAskobot(channel, tags, args) {
    const user = {
      name: tags["display-name"],
      color: tags.color,
    };
    const message = args.join(" ");
    this.askAskobot(channel, user, message);
    this.logToDiscord(channel, user.name, message);
  }

  /**
   * Sends a question to OpenAI and relays the response back to the Twitch channel.
   * Manages chat history
   * appends additional Twitch channel context (cached for 5 minutes).
   *
   * @param {string} channel - The channel to send the response to.
   * @param {object} user - The name and color of the user who asked the question.
   * @param {string} message - The user's question.
   */
  async askAskobot(channel, user, message) {
    this.lastBotActivity = Date.now();

    const channelInfo = await getChannelInfo(channel);
    const channelConfig = this.config.channels.find(
      (c) => c.twitchChannel === channel,
    );

    if (!this.chatHistory[channel]) {
      this.chatHistory[channel] = [];
    }

    if (this.chatHistory[channel].length > this.config.memoryCapacity) {
      this.chatHistory[channel] = this.chatHistory[channel].slice(
        -this.config.memoryCapacity,
      );
    }

    // TODO
    const cardTools = [
      {
        type: "function",
        function: {
          name: "get_card_info",
          description:
            "Fetch Hearthstone Battlegrounds card details. Use this tool when a user asks about a specific card.",
          parameters: {
            type: "object",
            properties: {
              card_name: {
                type: "string",
                description:
                  "The name of the Hearthstone Battlegrounds card to fetch information about.",
              },
              golden: {
                type: "boolean",
                description:
                  "Whether to fetch information about the golden version of the card.",
              },
            },
            required: ["card_name"],
            additionalProperties: false,
          },
        },
      },
    ];

    const heroTools = [
      {
        type: "function",
        function: {
          name: "get_hero_power_info",
          description:
            "Fetch the hero power of a specific Hearthstone Battlegrounds hero. This function should only be used when the user asks specifically about the hero power (hp) of the hero, nothing else.",
          parameters: {
            type: "object",
            properties: {
              hero_name: {
                type: "string",
                description:
                  "The name of the Hearthstone Battlegrounds hero to fetch the hero power information for.",
              },
            },
            required: ["hero_name"],
            additionalProperties: false,
          },
        },
      },
    ];

    await this.openAI({
      model: config.model,
      prompt: `The user "${user.name}" just said: "${message}".`,
      promptVars: buildPromptVars({
        user,
        message,
        channelConfig,
        channelInfo,
      }),
      history: this.chatHistory[channel],
      outputSchema: z.object({
        response: z.string(),
        emotion: z.enum(channelConfig.mood),
        animation: z.enum(config.animations),
      }),
    })
      .then((result) => {
        this.chatHistory[channel].push({
          role: "user",
          content: `@${user.name}: ${message}`,
        });
        this.chatHistory[channel].push({
          role: "assistant",
          content: result.response,
        });
        this.logToDiscord(channel, "Askowbot", result.response);
        this.client.say(channel, `🤖 ${result.response} 🤖`);
        this.emit("bot-voice", {
          channel,
          result,
          user,
        });
      })
      .catch((error) => {
        console.error("Error in askAskobot:", error);
        const fallbackMessage =
          "Erreur : J'ai oublié comment parler poliment, désolé !";
        this.client.say(channel, `🤖 ${fallbackMessage} 🤖`);
        this.logToDiscord(channel, "Askowbot", `❌ ERROR: ${error.message} ❌`);
      });
  }

  /**
   * Reacts to live Twitch events (such as new followers, scene changes, or inactivity).
   * Sends a contextually appropriate message generated by OpenAI to the channel.
   *
   * @param {string} channel - The channel where the event occurred.
   * @param {object} event - Contains eventType and associated data.
   */
  async reactToEvent(channel, { eventType, data }) {
    this.lastBotActivity = Date.now();

    let message;
    switch (eventType) {
      case "scene-change":
        message = `The OBS scene has changed on stream. It's the "${data.sceneName}" scene. React with a short, witty and energetic comment, even if the scene change seems trivial.`;
        break;
      case "first-message":
        message = `A viewer (${data.username}) just sent their very first message in the chat. Celebrate it with a short, enthusiastic but cheeky comment.`;
        break;
      case "new-follower":
        message = `A new follower (${data.username}) has joined the channel. Welcome them with a short, sarcastic but friendly message! welcome ${data.username}!`;
        break;
      case "channel-raid":
        message = `Another streamer just raided the channel with their viewers. Welcome them all with a sarcastic but festive short message.`;
        break;
      case "user-sub":
        message = `A viewer just subscribed or resubscribed. Thank them warmly but with your classic sarcastic tone in a short sentence.`;
        break;
      case "idle":
        message = `You have been inactive for a while, you say a short, friendly sentence informing people that you are awake.`;
        break;
      case "action-talkToCamera":
        message = `can you say "boo!"`;
        break;
      default:
        message = "Nothing actually happened!";
    }

    const channelInfo = await getChannelInfo(channel);
    const channelConfig = this.config.channels.find(
      (c) => c.twitchChannel === channel,
    );

    await this.openAI({
      model: config.model,
      prompt: `New Event: "${message}" happened on the channel`,
      promptVars: buildPromptVars({
        user: "",
        message,
        channelConfig,
        channelInfo,
      }),
      history: this.chatHistory[channel],
      outputSchema: z.object({
        response: z.string(),
        emotion: z.enum(channelConfig.mood),
        animation: z.enum(config.animations),
      }),
    })
      .then((result) => {
        this.logToDiscord(channel, "Askowbot", result.response);
        this.client.say(channel, `🤖 ${result.response} 🤖`);
        this.emit("bot-voice", {
          channel,
          result,
        });
      })
      .catch((error) => {
        console.error("Error in reactToEvents:", error);
        this.logToDiscord(channel, "Askowbot", `❌ ERROR: ${error.message} ❌`);
      });
  }
  /**
   * Logs a message to Discord using the imported log function.
   *
   * @param {string} channel - The channel where the log originates.
   * @param {string} user - The user associated with the log entry.
   * @param {string} message - The log message.
   */
  logToDiscord(channel, user, message) {
    log
      .message()
      .addField({ name: user, value: message })
      .addFooter(`channel: ${channel}`) // Small text at the end of discord notification
      .sendMessage();
  }

  /**
   * Connects the Twitch client and logs a startup message.
   */
  connect() {
    this.client.connect();
    log
      .sucessfulMessage()
      .addTitle("🚀 Askowbot Launch success 🚀")
      .sendMessage();
  }
}
