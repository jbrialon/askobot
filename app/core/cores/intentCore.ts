import type { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { intentCategories, intentFields } from "../tapes/intentTape.ts";
import type { IntentClassification } from "../types.ts";

/**
 * IntentCore - AskOS Precognition Module
 *
 * Uses a small, cheap model to read the user's mind before the big brain kicks in.
 * Decides what context the main model actually needs, because not every "lol"
 * deserves 900 tokens of personality backstory.
 *
 * [Note: The small model has no ego and works for cheap. Ideal employee]
 * [Warning: Classification happens faster than you can say "prompt chaining"]
 * [Status: Judging your messages in under 200ms]
 *
 * Part of the AskOS Core Systems v0.2alpha
 */

function buildPrompt(): string {
  const categories = intentCategories.join(", ");
  const fields = intentFields.map((f) => `  "${f.name}": <${f.description}>`).join(",\n");

  return `Classify this Twitch/Discord chat message. Return JSON only.
Intent categories: ${categories}.
{
  "intent": "<category>",
${fields}
}`;
}

function buildSchema() {
  const shape: Record<string, z.ZodTypeAny> = {
    intent: z.enum(intentCategories),
  };

  for (const field of intentFields) {
    shape[field.name] = field.type === "boolean" ? z.boolean() : z.string();
  }

  return z.object(shape);
}

function buildDefaultIntent(): IntentClassification {
  const defaults: Record<string, boolean | string> = {
    intent: "other",
  };

  for (const field of intentFields) {
    defaults[field.name] = field.defaultValue;
  }

  return defaults as unknown as IntentClassification;
}

const intentPrompt = buildPrompt();
const intentSchema = buildSchema();
const defaultIntent = buildDefaultIntent();

export class IntentCore {
  private mistral: Mistral;
  private model: string = "mistral-small-latest";

  constructor(mistral: Mistral) {
    this.mistral = mistral;
  }

  async classify(message: string): Promise<IntentClassification> {
    try {
      const response = await this.mistral.chat.parse({
        model: this.model,
        messages: [
          { role: "system", content: intentPrompt },
          { role: "user", content: message },
        ],
        responseFormat: intentSchema,
        temperature: 0,
      });

      const parsed = response.choices?.[0]?.message?.parsed;
      if (parsed) {
        return parsed as IntentClassification;
      }

      return defaultIntent;
    } catch (error) {
      console.error("[IntentCore] Classification failed, using default:", error);
      return defaultIntent;
    }
  }
}
