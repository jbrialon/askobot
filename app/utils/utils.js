import fetch from "node-fetch";
import os from "os";
import { EmbedBuilder } from "discord.js";
import discordBot from "../discord/discord-bot.js";

let cachedToken = null;
let tokenExpiry = 0;

const getValidToken = async () => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  if (cachedToken && now < tokenExpiry) {
    return cachedToken; // Return cached token if it's still valid
  }

  const { token, expiresIn } = await getOAuthToken();
  cachedToken = token;
  tokenExpiry = now + expiresIn - 60; // Refresh 1 minute before actual expiration
  return cachedToken;
};

const getOAuthToken = async () => {
  const tokenUrl = "https://oauth.battle.net/token";
  const authString = Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Return the token and expiration time
    return {
      token: data.access_token,
      expiresIn: data.expires_in, // Validity period in seconds
    };
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    throw error;
  }
};

const logToDiscord = async (embed, channel, fallbackMessage) => {
  try {
    embed.setFooter({ text: `${os.hostname()} • ${process.env.APP_ENV} • ${channel}` }).setTimestamp();

    await discordBot.log(embed);
  } catch (error) {
    console.error(`[DISCORD ERROR] Failed to send Discord message: ${error.message}`);
    if (fallbackMessage) {
      console.log(`[FALLBACK] ${fallbackMessage}`);
    }
  }
};

const log = {
  info: ({ user, message, channel }) => {
    console.log(`[INFO] ${user}: ${message} (${channel})`);
    const embed = new EmbedBuilder().setColor(0x0099ff).setTitle(user).setDescription(message);
    logToDiscord(embed, channel, `INFO: ${user} - ${message} (${channel})`);
  },
  warn: ({ user, message, channel }) => {
    console.warn(`[WARN] ${user}: ${message} (${channel})`);
    const embed = new EmbedBuilder().setColor(0xffcc00).setTitle(user).setDescription(message);
    logToDiscord(embed, channel, `WARN: ${user} - ${message} (${channel})`);
  },
  error: ({ user, message, channel }) => {
    console.error(`[ERROR] ${user}: ${message} (${channel})`);
    const embed = new EmbedBuilder().setColor(0xff0000).setTitle(user).setDescription(message);
    logToDiscord(embed, channel, `ERROR: ${user} - ${message} (${channel})`);
  },
  success: ({ user, message, channel }) => {
    console.log(`[SUCCESS] ${user}: ${message} (${channel})`);
    const embed = new EmbedBuilder().setColor(0x00ff00).setTitle(user).setDescription(message);
    logToDiscord(embed, channel, `SUCCESS: ${user} - ${message} (${channel})`);
  },
  command: ({ user, channel, question, response, command }) => {
    console.log(`[COMMAND] ${user} used ${command}: "${question}"\nResponse: "${response}" (${channel})`);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("<:askobot:1417924303755935754> Askobot Interaction <:askobot:1417924303755935754>")
      .setDescription(`**User:** ${user}\n**Command:** ${command}\n**Question:** ${question}\n**Response:** ${response}`);
    logToDiscord(embed, channel, `COMMAND: ${user} used ${command} in ${channel}`);
  },
};

// Function to add French ordinal suffixes
const getFrenchOrdinal = (rank) => {
  if (rank === 1) return `${rank}er`; // "1er" for 1st place
  return `${rank}ème`; // "2ème", "3ème", etc. for other ranks
};

const cleanText = (text) => {
  return text.replace(/<\/?(b|i)>/g, ""); // Removes <b>, </b>, <i>, and </i> tags};
};

export { getValidToken, log, getFrenchOrdinal, cleanText };
