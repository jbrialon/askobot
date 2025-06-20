import fetch from "node-fetch";
import { DiscordNotification } from "@penseapp/discord-notification";
import os from "os";

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

const discordLog = new DiscordNotification(os.hostname(), process.env.DISCORD_WEBHOOK);

const log = {
  info: ({ user, message, channel }) => {
    console.log(`[INFO] ${user}: ${message} (${channel})`);
    discordLog
      .infoMessage()
      .addTitle(user)
      .addDescription(message)
      .addField({ name: "env", value: process.env.APP_ENV })
      .addField({ name: "port", value: process.env.APP_PORT })
      .addFooter(`channel: ${channel}`)
      .sendMessage();
  },
  warn: ({ user, message, channel }) => {
    console.warn(`[WARN] ${user}: ${message} (${channel})`);
    discordLog
      .warningMessage()
      .addTitle(user)
      .addDescription(message)
      .addField({ name: "env", value: process.env.APP_ENV })
      .addField({ name: "port", value: process.env.APP_PORT })
      .addFooter(`channel: ${channel}`)
      .sendMessage();
  },
  error: ({ user, message, channel }) => {
    console.error(`[ERROR] ${user}: ${message} (${channel})`);
    discordLog
      .errorMessage()
      .addTitle(user)
      .addDescription(message)
      .addField({ name: "env", value: process.env.APP_ENV })
      .addField({ name: "port", value: process.env.APP_PORT })
      .addFooter(`channel: ${channel}`)
      .sendMessage();
  },
  success: ({ user, message, channel }) => {
    console.log(`[SUCCESS] ${user}: ${message} (${channel})`);
    discordLog
      .sucessfulMessage()
      .addTitle(user)
      .addDescription(message)
      .addField({ name: "env", value: process.env.APP_ENV })
      .addField({ name: "port", value: process.env.APP_PORT })
      .addFooter(`channel: ${channel}`)
      .sendMessage();
  },
  command: ({ user, channel, question, response, command }) => {
    console.log(`[COMMAND] ${user} used ${command}: "${question}"\nResponse: "${response}" (${channel})`);
    discordLog
      .infoMessage()
      .addTitle("🤖 Askobot Interaction 🤖")
      .addDescription(`**User: **${user}\n**Command: **${command}\n**Question: **${question}\n**Response: ** ${response}`)
      .addField({ name: "env", value: process.env.APP_ENV })
      .addField({ name: "port", value: process.env.APP_PORT })
      .addFooter(`channel: ${channel}`)
      .sendMessage();
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

export { getValidToken, getCurrentTimeOfDay, log, getFrenchOrdinal, cleanText };
