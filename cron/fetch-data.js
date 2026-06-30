import "dotenv/config";

import { existsSync, mkdirSync, writeFileSync, statSync } from "fs";
import { dirname } from "path";
import { EmbedBuilder } from "discord.js";
import { fetchAllCardData } from "../app/utils/battleground.js";
import discordBot from "../app/discord/discord-bot.ts";

const saveDataToFile = async (outputFilePath) => {
  const startTime = Date.now();

  try {
    console.log("Fetching data for cards");

    const embed = new EmbedBuilder()
      .setTitle("Card data import started")
      .setDescription("Fetching data for cards.")
      .setColor(0x00ae86)
      .setTimestamp();

    await discordBot.log(embed);

    const cardsData = await fetchAllCardData();
    if (cardsData) {
      const outputDir = dirname(outputFilePath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      writeFileSync(outputFilePath, JSON.stringify(cardsData, null, 2), "utf-8");

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = (statSync(outputFilePath).size / 1024).toFixed(2);

      console.log(`Cards data saved to: ${outputFilePath}`);

      const successEmbed = new EmbedBuilder()
        .setTitle("Card data import success")
        .setDescription("Hearthstone Battlegrounds cards data saved")
        .addFields(
          { name: "File", value: outputFilePath, inline: false },
          { name: "Size", value: `${fileSize} KB`, inline: true },
          { name: "Duration", value: `${duration}s`, inline: true },
        )
        .setColor(0x57f287)
        .setTimestamp();

      await discordBot.log(successEmbed);
    } else {
      console.log("No data found for cards");

      const errorEmbed = new EmbedBuilder()
        .setTitle("Card data import warning")
        .setDescription("No card data was returned from the API.")
        .setColor(0xfee75c)
        .setTimestamp();

      await discordBot.log(errorEmbed);
    }
  } catch (error) {
    console.log(`Error saving card data: "${error}"`);

    const errorEmbed = new EmbedBuilder()
      .setTitle("Card data import failed")
      .setDescription("Error saving card data")
      .addFields({ name: "Error", value: String(error), inline: false })
      .setColor(0xed4245)
      .setTimestamp();

    await discordBot.log(errorEmbed);
  }
};

const outputFilePath = "./db/cards.json";

// Wait for Discord bot to be ready before running the import
discordBot.once("ready", async () => {
  console.log("Discord bot ready, starting card data import.");
  await saveDataToFile(outputFilePath);

  // Give Discord time to send the final log message
  setTimeout(async () => {
    console.log("Import complete, disconnecting Discord bot.");
    await discordBot.disconnect();
    process.exit(0);
  }, 2000);
});
