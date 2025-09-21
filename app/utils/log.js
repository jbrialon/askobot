import os from "os";
import { EmbedBuilder } from "discord.js";
import discordBot from "../discord/discord-bot.js";

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

export { log };
