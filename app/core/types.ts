export interface ChatMessage {
  role: string;
  content: string;
}

export type IntentCategory = "greeting" | "question" | "opinion" | "knowledge" | "command_help" | "banter" | "meta" | "other";

export interface IntentClassification {
  intent: IntentCategory;
  needsCommands: boolean;
  needsGameData: boolean;
  gameQuery: string;
  needsPatchNotes: boolean;
}

export interface GenerateResponseParams {
  channel: string;
  user: string;
  message: string;
  platform?: "twitch" | "discord";
}

export interface reactToEventParams {
  channel: string;
  eventType: string;
  eventData: string;
  platform?: "twitch" | "discord";
}

export interface AskOSResponse {
  message: string;
  emotion: string;
  animation: string;
}

/**
 * Context variables used in context template replacement
 */
export interface ContextVars {
  /** Current username for template replacement */
  username: string;
  /** Current timestamp in locale string format */
  time: string;
  /** Context type-specific Markdown (either chat or event context) */
  contextType: string;
  /** Platform where the message originated (twitch or discord) */
  platform: "twitch" | "discord";
  /** Platform-specific information (Markdown formatted) */
  platformInfo: string;
  /** Available bot commands (Markdown formatted, empty if not relevant) */
  availableCommands: string;
  /** Streamer information (Markdown formatted) */
  streamer: string;
  /** Community members information (Markdown formatted) */
  community: string;
  /** Bot personality description (Markdown formatted) */
  personality: string;
  /** Game data from card lookup (Markdown formatted, empty if not relevant) */
  gameData: string;
  /** Patch notes content (Markdown formatted, empty if not relevant) */
  patchNotes: string;
  /** Custom rules based on context type (Markdown formatted, empty if not applicable) */
  customRules: string;
  /** Maximum character limit for responses */
  maxChar: number;
  /** Output format instructions (Markdown formatted) */
  outputFormat: string;
}

/**
 * Channel configuration structure
 */
export interface ChannelConfig {
  /** Twitch channel name */
  twitchChannel: string;
  /** Optional Discord guild IDs */
  discordGuild?: string[];
  /** Optional Discord notifications config */
  discordNotifications?: {
    guildId: string;
    channelId: string;
  };
  /** Maximum character limit for responses */
  maxChar: number;
  /** Battletag for Hearthstone rank lookups */
  battletag?: string;
}

/**
 * Parameters for building context variables
 */
export interface BuildContextParams {
  /** Type of context to build */
  type: "chat" | "event";
  /** Username of the person sending the message (for chat) or involved in event */
  user?: string;
  /** The message content (for chat type) */
  message?: string;
  /** Event type (for event type) */
  eventType?: string;
  /** Event-specific data (for event type) */
  eventData?: string;
  /** Platform (defaults to twitch if not specified) */
  platform?: "twitch" | "discord";
}
