import tmi from "tmi.js";
import OpenAI from "openai";
import os from "os";
import { EventEmitter } from "events";

import { log, getFrenchOrdinal } from "./utils/utils.js";
import { fetchCardData, fetchLeaderboardData } from "./battleground.js";
import { getChannelInfo } from "./twitchData.js";

import config from "./config.json" with { type: "json" };

/**
 * TwitchBot handles Twitch chat commands, interacts with OpenAI and manages bot state.
 */
export default class TwitchBot extends EventEmitter {
  /**
   * Constructs a new TwitchBot instance.
   * Initializes configuration, chat memory, command registry, and sets up the Twitch client.
   */
  constructor() {
    super();
    // Ensure chatMemory exists in config
    config.chatMemory = config.chatMemory || {};
    this.config = config;
    this.chatMemory = config.chatMemory;
    this.lastCommandTime = {};
    this.hostname = os.hostname();
    this.openai = new OpenAI({
      organization: process.env.ORGKEY,
      apiKey: process.env.APIKEY,
    });

    this.client = new tmi.Client({
      options: { debug: true },
      identity: {
        username: "Askowbot",
        password: `oauth:${process.env.TWITCH_OAUTH}`,
      },
      channels: this.config.channels.map((channel) =>
        channel.twitchChannel.slice(1),
      ),
    });

    setTimeout(() => {
      // this.client.say("#askowbol", `🤖 yo 🤖`);
    }, 1000);
    //

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
    const displayUserName = tags["display-name"];
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
        this.askGPT(channel, displayUserName, fallbackMessage);
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
  async handleAskobot(channel, tags, args, command) {
    const displayUserName = tags["display-name"];
    const question = args.join(" ");
    this.askGPT(channel, displayUserName, question);
    this.logToDiscord(channel, displayUserName, question);
  }

  /**
   * Sends a question to OpenAI and relays the response back to the Twitch channel.
   * Manages chat history, uses tools if trigger words are present, and
   * appends additional Twitch channel context (cached for 24 hours).
   *
   * @param {string} channel - The channel to send the response to.
   * @param {string} displayUserName - The display name of the user who asked the question.
   * @param {string} question - The user's question.
   */
  async askGPT(channel, displayUserName, question) {
    const channelConfig = this.config.channels.find(
      (c) => c.twitchChannel === channel,
    );
    const contexts = channelConfig.context;
    const channelInfo = await getChannelInfo(channel);

    // Build system content with additional Twitch context
    const title = channelInfo ? channelInfo.title : "N/A";
    const game = channelInfo ? channelInfo.game : "N/A";
    const description = channelInfo ? channelInfo.description : "N/A";
    const systemContentTemplate =
      contexts[Math.floor(Math.random() * contexts.length)];
    const systemContent = systemContentTemplate
      .replace("{{game}}", game)
      .replace("{{title}}", title)
      .replace("{{desc}}", description);

    let content = "";
    // Initialize chat history for the channel if not present
    if (!this.chatMemory[channel]) {
      this.chatMemory[channel] = [];
    }
    // Trim chat history to configured memory capacity
    if (this.chatMemory[channel].length > this.config.memoryCapacity) {
      this.chatMemory[channel] = this.chatMemory[channel].slice(
        -this.config.memoryCapacity,
      );
    }

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

    const msg = `je suis ${displayUserName} et voici ma question: "${question}"`;

    try {
      const payload = {
        messages: [
          { role: "system", content: systemContent },
          ...this.chatMemory[channel],
          { role: "user", content: msg },
        ],
        model: "gpt-4o-mini",
      };

      if (this.config.gptCardTriggerWords.some((word) => msg.includes(word))) {
        payload.tools = cardTools;
      } else if (
        this.config.gptHeroTriggerWords.some((word) => msg.includes(word))
      ) {
        payload.tools = heroTools;
      }

      const response = await this.openai.chat.completions.create(payload);

      if (response.choices[0].finish_reason === "tool_calls") {
        const functionCall = response.choices[0].message.tool_calls[0].function;
        if (functionCall.name === "get_card_info") {
          const { card_name: cardName, golden } = JSON.parse(
            functionCall.arguments,
          );
          const cardData = fetchCardData(cardName, false);
          if (cardData) {
            content = `${cardData.name.fr}: ${
              golden ? cardData.upgradeText : cardData.text
            } `;
          } else {
            content = "Aucune carte trouvée portant ce nom 🤔";
          }
        } else if (functionCall.name === "get_hero_power_info") {
          const heroName = JSON.parse(functionCall.arguments).hero_name;
          const heroData = fetchCardData(heroName, true);
          if (heroData) {
            content = `${heroData.name.fr}: ${heroData.text} `;
          } else {
            content = "Aucun hero trouvé portant ce nom 🤔";
          }
        }
      } else {
        content = response.choices[0].message.content;
      }
    } catch (error) {
      console.error(error);
      content = "<Error.01.beep.boop>";
    }

    // Append the assistant's response to the chat history
    this.chatMemory[channel].push({
      role: "assistant",
      content: `${displayUserName} previous question was "${question}" and your answer was ${content}`,
    });

    this.logToDiscord(channel, "Askowbot", content);
    this.client.say(channel, `🤖 ${content} 🤖`);
  }

  /**
   * Logs a message to Discord using the imported log function.
   *
   * @param {string} channel - The channel where the log originates.
   * @param {string} user - The user associated with the log entry.
   * @param {string} message - The log message.
   */
  logToDiscord(channel, user, message) {
    log(channel, user, message);
  }

  /**
   * Connects the Twitch client and logs a startup message.
   */
  connect() {
    this.client.connect();
    log("server", this.hostname, `🚀 Askowbot Launch success 🚀`);
  }
}
