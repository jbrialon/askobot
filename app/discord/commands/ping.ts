import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { CommandHandler } from "./types.js";

export class PingCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!");

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      content: "pong!",
    });
  }
}

export const pingCommand = new PingCommand();
