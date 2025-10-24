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

export function createOutputSchema(): z.ZodObject<{
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
