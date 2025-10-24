import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import type { CommandHandler } from "./types.ts";

export class PingCommand implements CommandHandler {
  data = new SlashCommandBuilder().setName("ping").setDescription("Répond avec pong !");

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      content: "pong !",
    });
  }
}

export const pingCommand = new PingCommand();
