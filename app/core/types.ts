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
  /** Current timestamp in locale string format */
  time: string;
  /** Context type-specific XML (either chat or event context) */
  contextType: string;
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
  /** Custom rules based on context type (XML formatted, empty if not applicable) */
  customRules: string;
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
