import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface CommandHandler {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  guildId?: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
