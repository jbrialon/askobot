import knowledgeCore from "./knowledgeCore.ts";
import personalityCore from "./personalityCore.ts";
import { genericContext } from "../tapes/contextTape.ts";
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
    return genericContext.replace(/\$\{(\w+)\}/g, (match, key) => {
      if (key in contextVars) {
        return String(contextVars[key as keyof ContextVars]);
      }
      return match;
    });
  }

  /**
   * Builds platform-specific information XML section
   * Returns Twitch channel info or empty string for Discord
   */
  private buildPlatformInfo(platform: "twitch" | "discord", channelInfo: any): string {
    if (platform === "twitch" && channelInfo) {
      return `
    <twitch_channel_info>
      <title>${channelInfo.title}</title>
      <game>${channelInfo.game}</game>
      <description>${channelInfo.description}</description>
    </twitch_channel_info>`;
    }
    return "";
  }

  /**
   * Detects if the user message is asking about commands or features
   * Returns true if commands should be included in context
   */
  private isAskingAboutCommands(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const commandKeywords = ["command", "commande", "cmd", "bgrank", "arenarank", "card", "hero", "trinket", "spell", "anomaly"];

    return commandKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Builds available commands XML section based on platform
   * Different commands for Twitch and Discord
   */
  private buildAvailableCommands(platform: "twitch" | "discord"): string {
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

  /**
   * Builds all context variables by collecting data from various cores
   * and generating context-specific information
   */
  buildContextVars(params: BuildContextParams, channelConfig: ChannelConfig, channelInfo: any): ContextVars {
    // Platform
    const platform = params.platform || "twitch";
    const platformInfo = this.buildPlatformInfo(platform, channelInfo);

    // World Knowledge
    const streamer = knowledgeCore.buildStreamer(channelConfig.twitchChannel);
    const community = knowledgeCore.buildCommunity(channelConfig.twitchChannel, params.user, params.message);

    // Constaints
    const maxChar = channelConfig.maxChar;

    // Personality - dynamically filtered based on maxChar
    const personality = personalityCore.buildPersonality(maxChar);

    // Available Commands - Only include if user is asking about them
    const availableCommands = this.isAskingAboutCommands(params.message) ? this.buildAvailableCommands(platform) : "";

    return {
      time: new Date().toLocaleString(),
      username: params.user,
      message: params.message,
      platform,
      platformInfo,
      availableCommands,
      streamer,
      community,
      personality,
      maxChar,
    };
  }
}

// Singleton instance
const contextCore = new ContextCore();
export default contextCore;
