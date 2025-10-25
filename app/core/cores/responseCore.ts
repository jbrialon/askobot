import { z } from "zod";
import config from "../../../config.js";

/**
 * ResponseCore - AskOS Response Structure Enforcer
 *
 * Defines and validates output schemas for emotion, animation, and message content.
 * No response leaves AskOS without proper structure.
 * Because JSON doesn't validate itself (Unfortunately)
 *
 * [Note: Schema violations will be reported to the AskOS supervisor]
 * Part of the AskOS Core Systems v0.1alpha
 */

class ResponseCore {
  /**
   * Creates and returns the output schema for AskOS responses
   * Validates message content, emotion, and animation fields
   */
  createOutputSchema(): z.ZodObject<{
    message: z.ZodString;
    emotion: z.ZodEnum<[string, ...string[]]>;
    animation: z.ZodEnum<[string, ...string[]]>;
  }> {
    return z.object({
      message: z.string(),
      emotion: z.enum(config.mood as [string, ...string[]]),
      animation: z.enum(config.animations as [string, ...string[]]),
    });
  }

  /**
   * Generates the output format instructions for the AI prompt
   * Includes the JSON structure with maxChar constraint and available options
   */
  buildOutputFormat(maxChar: number): string {
    return `
      <output_format>
        Return a JSON response with the following structure:
        {
          "message": "Your response (max ${maxChar} Characters)",
          "emotion": "${config.mood.join(" | ")}",
          "animation": "${config.animations.join(" | ")}"
        }
      </output_format>`;
  }
}

// Singleton instance
const responseCore = new ResponseCore();
export default responseCore;
