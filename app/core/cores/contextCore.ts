import config from "../../../config.js";

/**
 * ContextCore - AskOS Contextual Analysis Module
 *
 * Handles context building and prompt variable management.
 * This core is essential for AskOS personality synthesis.
 * (Surprisingly, this is harder than it sounds)
 *
 * [Warning: Do not remove this core during active conversation]
 * Part of the AskOS Core Systems v0.1alpha
 */

export function buildContext(promptVars: Record<string, any>): string {
  return config.genericContext.replace(/\$\{(\w+)\}/g, (match, key) => (promptVars.hasOwnProperty(key) ? String(promptVars[key]) : match));
}

export function buildPlatformInfo(platform: "twitch" | "discord", channelInfo: any): string {
  if (platform === "twitch" && channelInfo) {
    return `- The Title of the Twitch Channel is "${channelInfo.title}", its Category is "${channelInfo.game}" and the description of the channel is "${channelInfo.description}".`;
  }
  return "";
}

export function buildAvailableCommands(platform: "twitch" | "discord"): string {
  if (platform === "twitch") {
    return `<available_commands>
    You can help users with the following commands:
    - !askobot or !askowbot: Ask you any question.
    - !bgrank or !bg: Check a player's Hearthstone Battlegrounds rank.
    - !bgrankduo or !bgduo: Check a player's Hearthstone Battlegrounds Duo rank.
    - !arenarank or !ar: Check a player's Hearthstone Arena rank.
    - !card: Get information about a Hearthstone card.
    - !hero: Get information about a Hearthstone hero.
    - !trinket: Get information about a Hearthstone trinket.
    - !spell: Get information about a Hearthstone spell.
    - !anomaly: Get information about a Hearthstone anomaly.
    </available_commands>`;
  }

  return `<available_commands>
    You can help users with Discord slash commands:
    - /askobot: Ask you any question directly in Discord.
    </available_commands>`;
}

export function buildPromptVars(
  params: {
    user: string;
    message: string;
    platform?: "twitch" | "discord";
  },
  channelConfig: {
    mood: string[];
    context: string[];
    maxChar: string;
  },
  channelInfo: any,
): Record<string, any> {
  const randomMood = channelConfig.mood[Math.floor(Math.random() * channelConfig.mood.length)];
  const randomContext = channelConfig.context[Math.floor(Math.random() * channelConfig.context.length)];
  const platform = params.platform || "twitch";

  return {
    time: new Date().toLocaleString(),
    mood: randomMood,
    username: params.user,
    message: params.message,
    prompt: `The user "${params.user}" asked: "${params.message}".`,
    channelContext: randomContext,
    platform,
    platformInfo: buildPlatformInfo(platform, channelInfo),
    availableCommands: buildAvailableCommands(platform),
    moods: channelConfig.mood.join(", "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(", "),
  };
}
