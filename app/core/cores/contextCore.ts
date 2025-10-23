import config from "../../../config.js";
import { buildCommunity } from "./knowledgeCore.ts";

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
    return `
    <twitch_channel_info>
      - Title: "${channelInfo.title}"
      - Category: "${channelInfo.game}"
      - Channel Description: "${channelInfo.description}"
    </twitch_channel_info>`;
  }
  return "";
}

export function buildAvailableCommands(platform: "twitch" | "discord"): string {
  if (platform === "twitch") {
    return `
    <available_commands>
      <command name="!askobot" aliases="!askowbot">
        Ask you any question
      </command>
      <command name="!bgrank" aliases="!bg">
        Check a player's Hearthstone Battlegrounds rank
      </command>
      <command name="!bgrankduo" aliases="!bgduo">
        Check a player's Hearthstone Battlegrounds Duo rank
      </command>
      <command name="!arenarank" aliases="!ar">
        Check a player's Hearthstone Arena rank
      </command>
      <command name="!card">
        Get information about a Hearthstone card
      </command>
      <command name="!hero">
        Get information about a Hearthstone Battlegrounds hero
      </command>
      <command name="!trinket">
        Get information about a Hearthstone trinket
      </command>
      <command name="!spell">
        Get information about a Hearthstone spell
      </command>
      <command name="!anomaly">
        Get information about a Hearthstone anomaly
      </command>
    </available_commands>`;
  }

  return `
  <discord_commands>
    <command name="/askobot">
      Ask you any question directly in Discord
    </command>
  </discord_commands>`;
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
    channelContext: randomContext,
    platform,
    platformInfo: buildPlatformInfo(platform, channelInfo),
    availableCommands: buildAvailableCommands(platform),
    community: buildCommunity(params.user, params.message),
    moods: channelConfig.mood.join(" | "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(" | "),
  };
}
