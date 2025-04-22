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
    this.config = config;
    this.chatHistory = {};
    this.lastCommandTime = {};
    this.hostname = os.hostname();

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

    this.emit("chat", {
      channel,
      tags,
      message,
    });

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
      context: `
You are Askobot, a \${mood} Robot assistant in a Twitch Channel. Askow also named Askowbol is your creator you are named after him, hence your name Asko-BOT.

The user "\${username}" just said: "\${message}".
\${context}
\${genericContext}
- Return a JSON with:
  - response
  - emotion: \${moods}.
  - animation: \${animations}.
    `,
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
        this.emit("voice", {
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
