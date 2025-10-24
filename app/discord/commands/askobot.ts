import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import askobot from "../../services/askobot.ts";
import type { CommandHandler } from "./types.ts";
import config from "../../../config.js";

export class AskobotCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("askobot")
    .setDescription("Poser une question au bot")
    .addStringOption((option) => option.setName("question").setDescription("Que veux-tu demander à Askobot ?").setRequired(true));

  private getConfigPerGuildId(guildId: string) {
    return config.channels.find((channel) => channel.discordGuild && channel.discordGuild.includes(guildId));
  }

  private convertMentionsToDiscordFormat(message: string, interaction: ChatInputCommandInteraction): string {
    const mentionRegex = /@([\w\u00C0-\u017F]+)/g;

    return message.replace(mentionRegex, () => {
      return `<@${interaction.user.id}>`;
    });
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.reply({ content: "Cette commande ne peut être utilisée que dans un serveur.", ephemeral: true });
      return;
    }

    const config = this.getConfigPerGuildId(guildId);
    if (!config) {
      await interaction.reply({ content: "Askobot n'est pas configuré pour ce serveur.", ephemeral: true });
      return;
    }

    const channel = config.twitchChannel;
    const question = interaction.options.getString("question")!;
    const displayName = interaction.user.globalName || interaction.user.username;

    // Defer the reply to buy more time for Askobot response
    await interaction.deferReply();

    try {
      const response = await askobot.generateResponse(channel, displayName, question, "discord");
      const message = this.convertMentionsToDiscordFormat(response.message, interaction);

      await interaction.editReply({
        content: `*${question}*\n**${message}**`,
      });
    } catch (error) {
      console.error("Error generating response:", error);
      await interaction.editReply({
        content: "<Error.02.beep.boop>",
      });
    }
  }
}

export const askobotCommand = new AskobotCommand();
