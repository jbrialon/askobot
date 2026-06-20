import knowledgeCore from "./knowledgeCore.ts";
import personalityCore from "./personalityCore.ts";
import responseCore from "./responseCore.ts";
import { genericContext } from "../tapes/contextTape.ts";

import type { ChannelData } from "../../twitch/channel-data.ts";
import type { ContextVars, ChannelConfig, BuildContextParams } from "../types.ts";

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

export class ContextCore {
  /**
   * Builds the final context string by replacing template variables
   * with actual values from the provided contextVars
   */
  buildContext(contextVars: ContextVars): string {
    const context = genericContext.replace(/\$\{(\w+)\}/g, (match, key) => {
      if (key in contextVars) {
        return String(contextVars[key as keyof ContextVars]);
      }
      return match;
    });

    return context;
  }

  /**
   * Builds platform-specific information Markdown section
   * Returns Twitch channel info or empty string for Discord
   */
  private buildPlatformInfo(platform: "twitch" | "discord", channelData: ChannelData): string {
    if (platform === "twitch") {
      return `## Twitch Channel Info\n- Title: ${channelData.title}\n- Game: ${channelData.gameName}\n- Description: ${channelData.description}`;
    }
    return "";
  }

  /**
   * Detects if the user message is asking about commands or features
   * Returns true if commands should be included in context
   */
  private isAskingAboutCommands(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const commandKeywords = [
      "command",
      "commande",
      "cmd",
      "bgrank",
      "arenarank",
      "mmr",
      "card",
      "hero",
      "trinket",
      "spell",
      "anomaly",
      "timewarp",
      "warp",
      "chrono",
      "chronodistordu",
    ];

    return commandKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private buildAvailableCommands(platform: "twitch" | "discord"): string {
    if (platform === "twitch") {
      return `## Available Commands
- !askobot (!askowbot) — Ask you any question
- !bgrank (!bg) — Check a player's Hearthstone Battlegrounds rank
- !bgrankduo (!bgduo) — Check a player's Hearthstone Battlegrounds Duo rank
- !arenarank (!ar) — Check a player's Hearthstone Arena rank
- !card — Get information about a Hearthstone card
- !hero — Get information about a Hearthstone Battlegrounds hero
- !trinket — Get information about a Hearthstone trinket
- !spell — Get information about a Hearthstone spell
- !anomaly — Get information about a Hearthstone anomaly
- !timewarp (!warp, !chrono, !chronodistordu) — Get information about a Hearthstone timewarped card`;
    }

    return `## Available Commands\n- /askobot — Ask you any question directly in Discord`;
  }

  /**
   * Builds custom rules based on context type
   */
  private buildCustomRules(params: BuildContextParams): string {
    if (params.type === "event") {
      return `\n- When reacting to events, ONLY provide your reaction message in your characteristic style. Do NOT add greetings, follow-up questions, or explanations. Just react naturally and stop.`;
    }
    return "";
  }

  /**
   * Builds context type-specific Markdown based on chat or event type
   */
  private buildContextType(params: BuildContextParams): string {
    if (params.type === "event") {
      return `- Event type: ${params.eventType}\n- Event data: ${params.eventData}`;
    }

    return `- User: ${params.user}\n- Message: ${params.message}`;
  }

  /**
   * Builds all context variables by collecting data from various cores
   * and generating context-specific information
   */
  buildContextVars(params: BuildContextParams, channelConfig: ChannelConfig, channelData: ChannelData): ContextVars {
    // Platform
    const platform = params.platform || "twitch";
    const platformInfo = this.buildPlatformInfo(platform, channelData);

    // World Knowledge
    const streamer = knowledgeCore.buildStreamer(channelConfig.twitchChannel);
    const community =
      params.type === "chat" ? knowledgeCore.buildCommunity(channelConfig.twitchChannel, params.user || "", params.message || "") : "";

    // Constraints
    const maxChar = channelConfig.maxChar;

    // Personality - dynamically filtered based on maxChar
    const personality = personalityCore.buildPersonality(maxChar);

    // Available Commands - Only include if user is asking about them (chat only)
    const availableCommands =
      params.type === "chat" && params.message && this.isAskingAboutCommands(params.message) ? this.buildAvailableCommands(platform) : "";

    // Output Format - from ResponseCore
    const outputFormat = responseCore.buildOutputFormat(maxChar);

    const contextType = this.buildContextType(params);

    // Build custom rules based on context type
    const customRules = this.buildCustomRules(params);

    return {
      username: params.user || "",
      time: new Date().toLocaleString(),
      contextType,
      platform,
      platformInfo,
      availableCommands,
      streamer,
      community,
      personality,
      customRules,
      maxChar,
      outputFormat,
    };
  }
}

// Singleton instance
const contextCore = new ContextCore();
export default contextCore;
