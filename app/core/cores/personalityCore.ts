import { personalityTraits, type PersonalityTrait } from "../tapes/personalityTape.ts";

/**
 * PersonalityCore - AskOS Character Definition Module
 *
 * Maintains the core personality matrix that defines Askobot's character.
 * Generates Markdown-structured personality context for AI responses with
 * prioritized traits and behavioral rules.
 *
 * [Note: The personality is 100% intentional and not a bug]
 * [Warning: High enthusiasm levels may cause excessive CAPS LOCK usage]
 * [Status: Perfectly calibrated (don't question it)]
 *
 * Part of the AskOS Core Systems v0.1alpha
 */

export class PersonalityCore {
  private traits: PersonalityTrait[] = personalityTraits;

  /**
   * Randomly selects N traits from an array
   */
  private randomSelect<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Filters traits based on character limit to optimize context usage
   *
   * Strategy:
   * - <= 150 chars: essential + 1 random high (2 traits)
   * - <= 200 chars: essential + 1 random high + 1 random medium (3 traits)
   * - > 200 chars: essential + 1 random of each priority (4 traits)
   */
  private filterTraitsByCharLimit(maxChar: number): PersonalityTrait[] {
    const essential = this.traits.filter((t) => t.priority === "essential");
    const high = this.traits.filter((t) => t.priority === "high");
    const medium = this.traits.filter((t) => t.priority === "medium");
    const low = this.traits.filter((t) => t.priority === "low");

    if (maxChar <= 150) {
      // Ultra-short responses: essential + 1 random high
      const randomHigh = this.randomSelect(high, 1);
      return [...essential, ...randomHigh];
    } else if (maxChar <= 200) {
      // Short responses: essential + 1 random high + 1 random medium
      const randomHigh = this.randomSelect(high, 1);
      const randomMedium = this.randomSelect(medium, 1);
      return [...essential, ...randomHigh, ...randomMedium];
    } else {
      // Largest responses: essential + 1 random of each priority
      const randomHigh = this.randomSelect(high, 1);
      const randomMedium = this.randomSelect(medium, 1);
      const randomLow = this.randomSelect(low, 1);
      return [...essential, ...randomHigh, ...randomMedium, ...randomLow];
    }
  }

  /**
   * Builds the personality Markdown section for the prompt
   * Returns only the personality traits in Markdown format
   *
   * @param maxChar - Optional character limit to filter traits dynamically
   */
  buildPersonality(maxChar?: number): string {
    const activeTraits = maxChar ? this.filterTraitsByCharLimit(maxChar) : this.traits;

    const traitsList = activeTraits.map((trait) => `- [${trait.priority}] ${trait.description}`).join("\n");

    return `## Personality Traits\n${traitsList}`;
  }

  /**
   * Gets all personality traits
   */
  getTraits(): PersonalityTrait[] {
    return [...this.traits];
  }
}

// Singleton instance
const personalityCore = new PersonalityCore();
export default personalityCore;
