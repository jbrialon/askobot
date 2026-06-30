import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import type { CommandHandler } from "./types.ts";
import { setPatchUrls, setPatchContent } from "../../utils/patch-store.ts";
import { crawlAndSummarize } from "../../utils/patch-crawler.ts";

export class SetPatchCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("setpatch")
    .setDescription("Définir les URLs du dernier patch Hearthstone Battlegrounds")
    .addStringOption((option) => option.setName("url_fr").setDescription("L'URL du patch note en français").setRequired(true))
    .addStringOption((option) => option.setName("url_en").setDescription("L'URL du patch note en anglais").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

  guildId = "1157764771681144924";

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const urlFr = interaction.options.getString("url_fr")!;
    const urlEn = interaction.options.getString("url_en")!;

    try {
      new URL(urlFr);
      new URL(urlEn);
    } catch {
      await interaction.reply({ content: "URL invalide.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const patch = setPatchUrls(urlFr, urlEn);

    try {
      const content = await crawlAndSummarize(patch.urlFr, patch.urlEn);
      setPatchContent(content);
      await interaction.editReply({ content: `Patch notes extraits et sauvegardés !\nFR: ${patch.urlFr}\nEN: ${patch.urlEn}` });
    } catch (error) {
      console.error("[SetPatch] Crawl failed:", error);
      await interaction.editReply({
        content: `URLs sauvegardées mais l'extraction a échoué: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}

export const setPatchCommand = new SetPatchCommand();
