import knowledgeCore from "./knowledgeCore.ts";
import personalityCore from "./personalityCore.ts";
import responseCore from "./responseCore.ts";
import { genericContext } from "../tapes/contextTape.ts";
import { searchCards } from "../../utils/battleground.js";
import { getPatchContent } from "../../utils/patch-store.ts";

import type { ChannelData } from "../../twitch/channel-data.ts";
import type { ContextVars, ChannelConfig, BuildContextParams, IntentClassification } from "../types.ts";

/**
 * ContextCore - AskOS Contextual Analysis Module
 *
 * Handles context building and prompt variable management.
 * This core is essential for AskOS personality synthesis.
 * (Surprisingly, this is harder than it sounds)
 *
 * [Warning: Do not remove this core during active conversation]
 * Part of the AskOS Core Systems v0.2alpha
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
  private buildCustomRules(params: BuildContextParams, intent?: IntentClassification): string {
    const rules: string[] = [];

    if (params.type === "event") {
      rules.push("- When reacting to events, ONLY provide your reaction message in your characteristic style. Do NOT add greetings, follow-up questions, or explanations. Just react naturally and stop.");
    }

    if (intent?.needsGameData) {
      rules.push("- When Game Data is provided below, ONLY use the stats, effects, and details from that data. Never invent or guess stats, attack/health values, or effects that aren't in the provided data.");
    }

    return rules.length > 0 ? `\n${rules.join("\n")}` : "";
  }

  /**
   * Builds context type-specific Markdown based on chat or event type
   */
  private buildContextType(params: BuildContextParams, intent?: IntentClassification): string {
    if (params.type === "event") {
      return `- Event type: ${params.eventType}\n- Event data: ${params.eventData}`;
    }

    const intentLine = intent ? `\n- Message intent: ${intent.intent}` : "";
    return `- User: ${params.user}\n- Message: ${params.message}${intentLine}`;
  }

  /**
   * Builds all context variables by collecting data from various cores
   * and generating context-specific information
   */
  private formatCardType(card: any): string {
    const bg = card.battlegrounds;
    if (bg?.hero) return "Hero";
    if (bg?.spell) return "Spell";
    if (bg?.anomaly) return "Anomaly";
    if (bg?.trinket) return "Trinket";
    if (bg?.quest) return "Quest";
    if (bg?.reward) return "Reward";
    if (bg?.timewarp) return "Timewarp";
    if (bg?.tavernTier) return `Minion — Tier ${bg.tavernTier}`;
    return "Unknown";
  }

  private formatCard(card: any, score: number): string {
    const isHero = card.battlegrounds?.hero;
    const effectLabel = isHero ? "Hero Power (hp/pouvoir)" : "Effect";
    let info = `### ${card.name.fr} (${card.name.en}) — match: ${Math.round((1 - score) * 100)}%\n- Type: ${this.formatCardType(card)}\n- ${effectLabel}: ${card.text}`;
    if (card.minion) info += `\n- Stats: ${card.minion.attack}/${card.minion.health} (attack/health)`;
    if (card.upgradeText) info += `\n- Golden: ${card.upgradeText}`;
    if (card.companion) {
      info += `\n- Companion: ${card.companion.name} — ${card.companion.text}`;
      if (card.companion.attack != null) info += `\n- Companion Stats: ${card.companion.attack}/${card.companion.health} (attack/health)`;
    }
    return info;
  }

  private async buildGameData(query: string): Promise<string> {
    try {
      const results = await (searchCards as any)(query, 0.2, 3);
      if (!results || results.length === 0) {
        return `## Game Data\nNo match found for "${query}" in the database. Do NOT invent stats or effects. Stay in character and tell the user the card wasn't found in your database.`;
      }

      const header = `## Game Data (best matches for "${query}" — use the most relevant one, ignore poor matches)`;
      const cards = results.map((r: any) => this.formatCard(r.card, r.score)).join("\n");

      return `${header}\n${cards}`;
    } catch (error) {
      console.error("[ContextCore] Card lookup failed:", error);
      return "";
    }
  }

  private buildPatchNotes(): string {
    const content = getPatchContent();
    if (!content) return "";
    return `## Latest Patch Notes\n${content}`;
  }

  async buildContextVars(
    params: BuildContextParams,
    channelConfig: ChannelConfig,
    channelData: ChannelData,
    intent?: IntentClassification,
  ): Promise<ContextVars> {
    const username = params.user || "";
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

    // Available Commands - gated by intent classification (chat only)
    const availableCommands = params.type === "chat" && intent?.needsCommands ? this.buildAvailableCommands(platform) : "";

    // Game Data - gated by intent classification
    const gameData = intent?.needsGameData && intent.gameQuery ? await this.buildGameData(intent.gameQuery) : "";

    // Patch Notes - gated by intent classification
    const patchNotes = intent?.needsPatchNotes ? this.buildPatchNotes() : "";

    // Output Format - from ResponseCore
    const outputFormat = responseCore.buildOutputFormat(maxChar);

    const contextType = this.buildContextType(params, intent);

    // Build custom rules based on context type and intent
    const customRules = this.buildCustomRules(params, intent);

    return {
      username,
      time: new Date().toLocaleString(),
      contextType,
      platform,
      platformInfo,
      availableCommands,
      streamer,
      community,
      gameData,
      patchNotes,
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
