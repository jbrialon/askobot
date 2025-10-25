export interface ChatMessage {
  role: string;
  content: string;
}

export interface GenerateResponseParams {
  channel: string;
  user: string;
  message: string;
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
  /** Current timestamp in locale string format */
  time: string;
  /** Username of the person sending the message */
  username: string;
  /** The actual message content */
  message: string;
  /** Platform where the message originated (twitch or discord) */
  platform: "twitch" | "discord";
  /** Platform-specific information (XML formatted) */
  platformInfo: string;
  /** Available bot commands (XML formatted, empty if not relevant) */
  availableCommands: string;
  /** Streamer information (XML formatted) */
  streamer: string;
  /** Community members information (XML formatted) */
  community: string;
  /** Bot personality description (XML formatted) */
  personality: string;
  /** Maximum character limit for responses */
  maxChar: number;
  /** Output format instructions (XML formatted) */
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
  /** Username of the person sending the message */
  user: string;
  /** The message content */
  message: string;
  /** Platform (defaults to twitch if not specified) */
  platform?: "twitch" | "discord";
}
