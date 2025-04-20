import fetch from "node-fetch";
import { DiscordNotification } from "@penseapp/discord-notification";
import os from "os";
import config from "../../config.js";

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
  const authString = Buffer.from(
    `${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`,
  ).toString("base64");

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
      throw new Error(
        `Failed to fetch token: ${response.status} ${response.statusText}`,
      );
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

const getCurrentTimeOfDay = () => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    return "afternoon";
  } else if (currentHour >= 17 && currentHour < 20) {
    return "evening";
  } else {
    return "night";
  }
};

const log = new DiscordNotification(os.hostname(), process.env.DISCORD_WEBHOOK);

// Function to add French ordinal suffixes
const getFrenchOrdinal = (rank) => {
  if (rank === 1) return `${rank}er`; // "1er" for 1st place
  return `${rank}ème`; // "2ème", "3ème", etc. for other ranks
};

const cleanText = (text) => {
  return text.replace(/<\/?(b|i)>/g, ""); // Removes <b>, </b>, <i>, and </i> tags};
};

const buildPromptVars = ({ user, message, channelConfig, channelInfo }) => {
  const randomMood =
    channelConfig.mood[Math.floor(Math.random() * channelConfig.mood.length)];
  const randomContext =
    channelConfig.context[
      Math.floor(Math.random() * channelConfig.context.length)
    ];

  return {
    mood: randomMood,
    username: user.name,
    message,
    context: randomContext,
    genericContext: config.genericContext || "",
    title: channelInfo.title,
    game: channelInfo.game,
    desc: channelInfo.description,
    moods: channelConfig.mood.join(", "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(", "),
  };
};

export {
  getValidToken,
  getCurrentTimeOfDay,
  log,
  getFrenchOrdinal,
  cleanText,
  buildPromptVars,
};
