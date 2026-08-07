import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

import type { CommandHandler } from "./types.ts";

const COLORS = {
  SEARCH: 0x5865f2,
  PROGRESS: 0xfee75c,
  SUCCESS: 0x57f287,
  FAILURE: 0xed4245,
} as const;

interface StorageEntry {
  size: string;
  path: string;
}

function apiUrl(path: string): string {
  const base = process.env["LAB_API_URL"];
  if (!base) throw new Error("LAB_API_URL not configured");
  return `${base.replace(/\/+$/, "")}${path}`;
}

function apiHeaders(): Record<string, string> {
  const key = process.env["LAB_API_KEY"];
  if (!key) throw new Error("LAB_API_KEY not configured");
  return { "X-API-Key": key, "Content-Type": "application/json" };
}

export class StorageCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("storage")
    .setDescription("Manage storage downloads")
    .addSubcommand((sub) =>
      sub
        .setName("search")
        .setDescription("Search for files in remote storage")
        .addStringOption((opt) => opt.setName("query").setDescription("Search keyword").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("download")
        .setDescription("Download a file from remote storage")
        .addStringOption((opt) => opt.setName("path").setDescription("Remote path to download").setRequired(true)),
    );

  guildId = "1157764771681144924";

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "search") {
      await this.handleSearch(interaction);
    } else if (subcommand === "download") {
      await this.handleDownload(interaction);
    }
  }

  async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    const path = interaction.values[0]!;
    await interaction.deferReply();
    await this.startDownload(interaction, path);
  }

  private async handleSearch(interaction: ChatInputCommandInteraction): Promise<void> {
    const query = interaction.options.getString("query")!;
    await interaction.deferReply();

    try {
      const res = await fetch(apiUrl(`/storage-dl/search/${encodeURIComponent(query)}`), {
        headers: apiHeaders(),
      });

      if (!res.ok) {
        await interaction.editReply({ content: `API error: ${res.status} ${res.statusText}` });
        return;
      }

      const data = (await res.json()) as { success: boolean; keyword: string; entries: StorageEntry[] };

      if (!data.success || !data.entries.length) {
        await interaction.editReply({ content: `No results found for **${query}**` });
        return;
      }

      const total = data.entries.length;
      const shown = data.entries.slice(0, 15);

      const embed = new EmbedBuilder()
        .setTitle(`Search results for "${query}"`)
        .setColor(COLORS.SEARCH)
        .setDescription(
          shown.map((e) => `\`${e.size.padStart(6)}\` ${e.path}`).join("\n") + (total > 15 ? `\n\n*…and ${total - 15} more results*` : ""),
        );

      const menuOptions = shown
        .filter((e) => e.path.length <= 100)
        .map((e) => ({
          label: e.path.length > 100 ? `…${e.path.slice(-97)}` : e.path,
          description: e.size,
          value: e.path,
        }));

      if (!menuOptions.length) {
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("storage-dl-select")
        .setPlaceholder("Pick a file to download...")
        .addOptions(menuOptions);

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("[Storage] Search failed:", error);
      await interaction.editReply({
        content: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private async handleDownload(interaction: ChatInputCommandInteraction): Promise<void> {
    const path = interaction.options.getString("path")!;
    await interaction.deferReply();
    await this.startDownload(interaction, path);
  }

  private async startDownload(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction, remotePath: string): Promise<void> {
    try {
      const res = await fetch(apiUrl("/storage-dl"), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ path: remotePath }),
      });

      if (!res.ok) {
        await interaction.editReply({ content: `API error: ${res.status} ${res.statusText}` });
        return;
      }

      const data = (await res.json()) as {
        success: boolean;
        jobId: string;
        message: string;
        remotePath: string;
        dest: string;
      };

      const embed = new EmbedBuilder()
        .setTitle("Download queued")
        .setColor(COLORS.PROGRESS)
        .setDescription(`**Path:** ${data.remotePath}\n**Dest:** ${data.dest}\n\nWaiting for progress…`);

      await interaction.editReply({ embeds: [embed] });

      this.streamProgress(interaction, data.jobId, data.remotePath, data.dest);
    } catch (error) {
      console.error("[Storage] Download failed:", error);
      await interaction.editReply({
        content: `Download failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private async streamProgress(
    interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
    jobId: string,
    remotePath: string,
    dest: string,
  ): Promise<void> {
    try {
      const res = await fetch(apiUrl(`/storage-dl/events/${jobId}`), {
        headers: { "X-API-Key": process.env["LAB_API_KEY"]! },
      });

      if (!res.ok || !res.body) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setTitle("Download error").setColor(COLORS.FAILURE).setDescription("Failed to connect to progress stream."),
          ],
        });
        return;
      }

      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastEditTime = 0;
      let latestLog = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!;

        for (const part of parts) {
          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1]!;
          const data = JSON.parse(dataMatch[1]!) as Record<string, unknown>;

          if (event === "log") {
            latestLog = (data["message"] as string) || "";
            const now = Date.now();
            if (now - lastEditTime >= 5000) {
              lastEditTime = now;
              await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Downloading…")
                    .setColor(COLORS.PROGRESS)
                    .setDescription(`**Path:** ${remotePath}\n**Dest:** ${dest}\n\n\`\`\`\n${latestLog}\n\`\`\``),
                ],
              });
            }
          }

          if (event === "complete") {
            const success = data["success"] as boolean;
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(success ? "Download complete" : "Download failed")
                  .setColor(success ? COLORS.SUCCESS : COLORS.FAILURE)
                  .setDescription(
                    success
                      ? `**Path:** ${remotePath}\n**Saved to:** ${(data["destPath"] as string) || dest}`
                      : `**Path:** ${remotePath}\n**Error code:** ${data["code"] ?? "unknown"}`,
                  ),
              ],
            });
            return;
          }
        }
      }
    } catch (error) {
      console.error("[Storage] SSE stream error:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Download error")
            .setColor(COLORS.FAILURE)
            .setDescription(`Progress stream failed: ${error instanceof Error ? error.message : String(error)}`),
        ],
      });
    }
  }
}

export const storageCommand = new StorageCommand();
