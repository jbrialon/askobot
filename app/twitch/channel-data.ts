import config from "../../config.js";
import { apiClient } from "../twitch/auth-clients.ts";

/**
 * Channel Data Manager
 *
 * Maintains an in-memory store of channel data that is updated via EventSub events.
 * This provides instant access to channel data without needing to cache or refetch from the API.
 */

// Non-game categories (content categories, not actual video games)
const NON_GAME_CATEGORIES = [
  "1469308723", // Software and Game Development
  "509658", // Just Chatting
  "509660", // Art
  "509659", // Music & Performing Arts
  "509670", // Science & Technology
  "509673", // Fitness & Health
  "509672", // Politics
  "509674", // Food & Drink
  "509669", // Special Events
  "509667", // Talk Shows & Podcasts
  "509671", // Travel & Outdoors
  "743", // Chess
];

// Custom game name overrides for specific games
const CUSTOM_GAME_NAMES: Record<string, string> = {
  "138585": "Hearthstone Battlegrounds", // Hearthstone
  "1469308723": "Développement Créatif", // Software and Game Development
};

/**
 * Helper function to determine if a gameId is an actual game or a content category
 */
function isGameCategory(gameId: string): boolean {
  return gameId !== "" && !NON_GAME_CATEGORIES.includes(gameId);
}

/**
 * Get custom game name if one exists, otherwise return the original
 */
function getCustomGameName(gameId: string, originalName: string): string {
  return CUSTOM_GAME_NAMES[gameId] ?? originalName;
}

/**
 * Add cache buster to thumbnail URL to ensure fresh images
 */
function addCacheBuster(url: string): string {
  const timestamp = Date.now();
  return `${url}?t=${timestamp}`;
}

export interface ChannelData {
  channel: string;
  displayName: string;
  userId: string;
  isLive: boolean;
  title: string;
  description: string;
  profilePictureUrl: string;
  gameName: string;
  gameId: string;
  isGame: boolean; // true if gameId is a game, false if it's a non-game category
  thumbnail?: string;
  gameThumbnail: string;
  viewerCount?: number;
  startedAt?: Date;
  lastUpdated: Date;
}

// Private store
const channelDataStore = new Map<string, ChannelData>();
let initialized = false;

/**
 * Initialize channel data for all channels from config
 */
export async function initChannelData(): Promise<void> {
  if (initialized) {
    return;
  }

  const channels = config.channels.map((c) => c.twitchChannel);
  console.log(`[ChannelData] Initializing channel data for ${channels.length} channels...`);

  await Promise.all(
    channels.map(async (channel) => {
      try {
        await fetchChannelData(channel);
        console.log(`[ChannelData] Fetched data for "${channel}"`);
      } catch (error) {
        console.error(`[ChannelData] Failed to fetch data for "${channel}"`, error);
      }
    }),
  );

  initialized = true;
}

/**
 * Fetch and store channel data from Twitch API
 */
async function fetchChannelData(channel: string): Promise<void> {
  const user = await apiClient.users.getUserByName(channel);
  if (!user) {
    throw new Error(`User not found: ${channel}`);
  }

  const channelInfo = await apiClient.channels.getChannelInfoById(user.id);
  if (!channelInfo) {
    throw new Error(`Channel info not found: ${channel}`);
  }

  const stream = await user.getStream();

  const gameId = channelInfo.gameId || "";
  const gameName = getCustomGameName(gameId, channelInfo.gameName || "");

  let gameThumbnail = "";
  if (gameId) {
    const game = await apiClient.games.getGameById(gameId);
    if (game) {
      gameThumbnail = game.getBoxArtUrl(285, 380);
    }
  }

  const data: ChannelData = {
    channel: channel.toLowerCase(),
    displayName: user.displayName,
    userId: user.id,
    isLive: stream !== null,
    title: channelInfo.title || "",
    description: user.description,
    profilePictureUrl: user.profilePictureUrl,
    gameName: gameName,
    gameId: gameId,
    isGame: isGameCategory(gameId),
    gameThumbnail: gameThumbnail,
    lastUpdated: new Date(),
  };

  // Add optional properties only if stream is live
  if (stream) {
    const thumbnail = stream.getThumbnailUrl(1920, 1080);
    if (thumbnail) {
      data.thumbnail = addCacheBuster(thumbnail);
    }
    if (stream.viewers !== undefined) {
      data.viewerCount = stream.viewers;
    }
    if (stream.startDate) {
      data.startedAt = stream.startDate;
    }
  }

  channelDataStore.set(channel.toLowerCase(), data);
}

/**
 * Get the current data for a channel
 * If not initialized, will fetch data on-demand for this channel only
 */
export async function getChannelData(channel: string): Promise<ChannelData | null> {
  const channelKey = channel.toLowerCase();
  let data = channelDataStore.get(channelKey);

  const startTime = Date.now();

  // If not found and not initialized, fetch on-demand
  if (!data && !initialized) {
    try {
      await fetchChannelData(channelKey);
      data = channelDataStore.get(channelKey);
    } catch (error) {
      console.error(`[ChannelData] Failed to fetch on-demand data for "${channel}"`, error);
      return null;
    }
  }
  const duration = Date.now() - startTime;
  console.log(`[ChannelData] Fetched data for "${channel}" in ${duration}ms`);
  return data || null;
}

/**
 * Update channel data with partial data
 */
export function updateChannelData(channel: string, data: Partial<ChannelData>): void {
  const channelKey = channel.toLowerCase();
  const existing = channelDataStore.get(channelKey);

  const gameId = data.gameId ?? existing?.gameId ?? "";
  const gameName = getCustomGameName(gameId, data.gameName ?? existing?.gameName ?? "");

  const updated: ChannelData = {
    channel: channelKey,
    displayName: data.displayName || existing?.displayName || channel,
    userId: data.userId ?? existing?.userId ?? "",
    isLive: data.isLive ?? existing?.isLive ?? false,
    title: data.title ?? existing?.title ?? "",
    description: data.description ?? existing?.description ?? "",
    profilePictureUrl: data.profilePictureUrl ?? existing?.profilePictureUrl ?? "",
    gameName: gameName,
    gameId: gameId,
    isGame: data.isGame ?? isGameCategory(gameId),
    gameThumbnail: data.gameThumbnail ?? existing?.gameThumbnail ?? "",
    lastUpdated: new Date(),
  };

  // Add optional properties if they have defined values
  const thumbnail = data.thumbnail ?? existing?.thumbnail;
  if (thumbnail !== undefined) {
    updated.thumbnail = thumbnail;
  }

  const viewerCount = data.viewerCount ?? existing?.viewerCount;
  if (viewerCount !== undefined) {
    updated.viewerCount = viewerCount;
  }

  const startedAt = data.startedAt ?? existing?.startedAt;
  if (startedAt !== undefined) {
    updated.startedAt = startedAt;
  }

  channelDataStore.set(channelKey, updated);
}

/**
 * Set a channel as online (called from stream.online event)
 * It's returning a promise because the event alone does not provide all the data we would need
 */
export async function setStreamOnline(channel: string): Promise<void> {
  const user = await apiClient.users.getUserByName(channel);
  if (!user) {
    throw new Error(`User not found: ${channel}`);
  }

  const channelInfo = await apiClient.channels.getChannelInfoById(user.id);
  if (!channelInfo) {
    throw new Error(`Channel info not found: ${channel}`);
  }

  const stream = await user.getStream();

  if (!stream) {
    throw new Error(`Stream info not found: ${channel}`);
  }

  const thumbnail = stream.getThumbnailUrl(1920, 1080);

  // Fetch game thumbnail (box art)
  let gameThumbnail = "";
  const gameId = channelInfo.gameId;
  if (gameId) {
    const game = await apiClient.games.getGameById(gameId);
    if (game) {
      gameThumbnail = game.getBoxArtUrl(285, 380);
    }
  }

  const updateData: Partial<ChannelData> = {
    viewerCount: stream.viewers,
    startedAt: stream.startDate,
    gameThumbnail: gameThumbnail,
    isLive: true,
  };

  if (thumbnail) {
    updateData.thumbnail = addCacheBuster(thumbnail);
  }

  updateChannelData(channel, updateData);
}

/**
 * Set a channel as offline (called from stream.offline event)
 */
export function setStreamOffline(channel: string): void {
  const channelKey = channel.toLowerCase();
  const existing = channelDataStore.get(channelKey);
  if (existing) {
    const updated: ChannelData = {
      ...existing,
      isLive: false,
      lastUpdated: new Date(),
    };
    // Remove live-specific properties
    delete updated.thumbnail;
    delete updated.viewerCount;
    delete updated.startedAt;

    channelDataStore.set(channelKey, updated);
  }
}

/**
 * Update channel info (called from channel.update event)
 */
export async function updateChannelInfo(
  channel: string,
  data: {
    displayName?: string;
    title: string;
    gameName: string;
    gameId: string;
  },
): Promise<void> {
  let gameThumbnail = "";
  if (data.gameId) {
    const game = await apiClient.games.getGameById(data.gameId);
    if (game) {
      gameThumbnail = game.getBoxArtUrl(285, 380);
    }
  }

  updateChannelData(channel, { ...data, gameThumbnail });
}
