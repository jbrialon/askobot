import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import askobot from "../../services/askobot.js";
import { CommandHandler } from "./types.js";

export class AskobotCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("askobot")
    .setDescription("Ask the bot a question")
    .addStringOption((option) => option.setName("question").setDescription("What do you want to ask Askobot?").setRequired(true));

  private convertMentionsToDiscordFormat(message: string, interaction: ChatInputCommandInteraction): string {
    const mentionRegex = /@([\w\u00C0-\u017F]+)/g;

    return message.replace(mentionRegex, () => {
      return `<@${interaction.user.id}>`;
    });
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const question = interaction.options.getString("question")!;
    const displayName = interaction.user.globalName || interaction.user.username;
    // const guildName = interaction.guild?.name || "DM";
    // Todo should match the guildname to the config.channel for Askobot context
    // console.log("User info:", {
    //   username: interaction.user.username,
    //   globalName: interaction.user.globalName,
    //   displayName: displayName,
    //   guildName: guildName
    // });
    // Defer the reply to buy more time for Askobot response
    await interaction.deferReply();

    try {
      const response = await askobot.generateResponse("askowbol", displayName, question);
      const message = this.convertMentionsToDiscordFormat(response.message, interaction);

      await interaction.editReply({
        content: `*${question}*\n**${message}**`,
      });
    } catch (error) {
      console.error("Error generating response:", error);
      await interaction.editReply({
        content: "Sorry, I encountered an error while processing your request.",
      });
    }
  }
}

export const askobotCommand = new AskobotCommand();
