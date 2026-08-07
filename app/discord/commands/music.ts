import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ButtonInteraction,
} from "discord.js";

import type { CommandHandler } from "./types.ts";

const COLORS = {
  PURPLE: 0x9b59b6,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
} as const;

const ROOMS = ["salon", "cuisine", "bureau", "chambre", "misc"] as const;

const STATE_TTL = 10 * 60 * 1000;

interface AlbumItem {
  title: string;
  thumbnail?: string;
  media_content_id?: string;
  media_content_type?: string;
}

interface GalleryState {
  albums: AlbumItem[];
  index: number;
  createdAt: number;
}

const galleryStates = new Map<string, GalleryState>();

function cleanupStates() {
  const now = Date.now();
  for (const [key, state] of galleryStates) {
    if (now - state.createdAt > STATE_TTL) {
      galleryStates.delete(key);
    }
  }
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

function buildAlbumEmbed(album: AlbumItem, index: number, total: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(album.title)
    .setColor(COLORS.PURPLE)
    .setFooter({ text: `Album ${index + 1} of ${total} — /music` });

  if (album.thumbnail) {
    embed.setImage(album.thumbnail);
  }

  return embed;
}

function buildGalleryButtons(index: number, total: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`music-prev:${index}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === 0),
    new ButtonBuilder().setCustomId(`music-play:${index}`).setLabel("Play this album").setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`music-next:${index}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === total - 1),
  );
}

export class MusicCommand implements CommandHandler {
  data = new SlashCommandBuilder()
    .setName("music")
    .setDescription("Search and play albums from Music Assistant")
    .addSubcommand((sub) =>
      sub
        .setName("search")
        .setDescription("Search for an album")
        .addStringOption((opt) => opt.setName("query").setDescription("Album name to search for").setRequired(true)),
    );

  guildId = "1157764771681144924";

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "search") {
      await this.handleSearch(interaction);
    }
  }

  async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    if (!interaction.customId.startsWith("music-room:")) return;

    const messageId = interaction.customId.split(":")[1]!;
    const room = interaction.values[0]!;
    const state = galleryStates.get(messageId);

    if (!state) {
      await interaction.reply({ content: "This session has expired. Please search again.", ephemeral: true });
      return;
    }

    const album = state.albums[state.index]!;
    await interaction.deferReply();

    try {
      const res = await fetch(apiUrl(`/media/play/album/${encodeURIComponent(room)}?album=${encodeURIComponent(album.title)}`), {
        headers: apiHeaders(),
      });

      if (!res.ok) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Playback error")
              .setColor(COLORS.ERROR)
              .setDescription(`API error: ${res.status} ${res.statusText}`),
          ],
        });
        return;
      }

      const data = (await res.json()) as { success: boolean; message: string; matched_title?: string; volume?: number };

      if (!data.success) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("Playback failed").setColor(COLORS.ERROR).setDescription(data.message)],
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Now playing")
        .setColor(COLORS.SUCCESS)
        .setDescription(`Now playing **${data.matched_title || album.title}** in **${room}**`);

      if (album.thumbnail) {
        embed.setThumbnail(album.thumbnail);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[Music] Play failed:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Playback error")
            .setColor(COLORS.ERROR)
            .setDescription(`Failed to play: ${error instanceof Error ? error.message : String(error)}`),
        ],
      });
    }
  }

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.customId.startsWith("music-")) return;

    const [action] = interaction.customId.split(":") as [string];
    const messageId = interaction.message.id;
    const state = galleryStates.get(messageId);

    if (!state) {
      await interaction.reply({ content: "This session has expired. Please search again.", ephemeral: true });
      return;
    }

    if (action === "music-prev") {
      state.index = Math.max(0, state.index - 1);
      const album = state.albums[state.index]!;
      await interaction.update({
        embeds: [buildAlbumEmbed(album, state.index, state.albums.length)],
        components: [buildGalleryButtons(state.index, state.albums.length)],
      });
    } else if (action === "music-next") {
      state.index = Math.min(state.albums.length - 1, state.index + 1);
      const album = state.albums[state.index]!;
      await interaction.update({
        embeds: [buildAlbumEmbed(album, state.index, state.albums.length)],
        components: [buildGalleryButtons(state.index, state.albums.length)],
      });
    } else if (action === "music-play") {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`music-room:${messageId}`)
        .setPlaceholder("Pick a room…")
        .addOptions(
          ROOMS.map((room) => ({
            label: room.charAt(0).toUpperCase() + room.slice(1),
            value: room,
          })),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      await interaction.reply({ content: "Where do you want to play this album?", components: [row], ephemeral: true });
    }
  }

  private async handleSearch(interaction: ChatInputCommandInteraction): Promise<void> {
    const query = interaction.options.getString("query")!;
    await interaction.deferReply();

    try {
      const res = await fetch(apiUrl("/media/browse?type=music_assistant&path=albums"), {
        headers: apiHeaders(),
      });

      if (!res.ok) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder().setTitle("Search error").setColor(COLORS.ERROR).setDescription(`API error: ${res.status} ${res.statusText}`),
          ],
        });
        return;
      }

      const data = (await res.json()) as { success: boolean; items: AlbumItem[] };

      if (!data.success || !data.items?.length) {
        await interaction.editReply({ content: `No albums found matching **${query}**` });
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = data.items.filter((item) => item.title.toLowerCase().includes(lowerQuery));

      if (!filtered.length) {
        await interaction.editReply({ content: `No albums found matching **${query}**` });
        return;
      }

      const reply = await interaction.editReply({
        embeds: [buildAlbumEmbed(filtered[0]!, 0, filtered.length)],
        components: [buildGalleryButtons(0, filtered.length)],
      });

      cleanupStates();
      galleryStates.set(reply.id, {
        albums: filtered,
        index: 0,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("[Music] Search failed:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Search error")
            .setColor(COLORS.ERROR)
            .setDescription(`Search failed: ${error instanceof Error ? error.message : String(error)}`),
        ],
      });
    }
  }
}

export const musicCommand = new MusicCommand();
