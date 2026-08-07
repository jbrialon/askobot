import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

export interface CommandHandler {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  guildId?: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  handleSelectMenu?: (interaction: StringSelectMenuInteraction) => Promise<void>;
}
