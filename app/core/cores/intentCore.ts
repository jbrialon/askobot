import type { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { intentCategories, intentFields } from "../tapes/intentTape.ts";
import type { ChatMessage, IntentClassification } from "../types.ts";

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

function buildPrompt(hasHistory: boolean): string {
  const categories = intentCategories.join(", ");
  const fields = intentFields.map((f) => `  "${f.name}": <${f.description}>`).join(",\n");

  const historyInstruction = hasHistory
    ? "\nConversation history is provided. Use it to:\n- Resolve pronouns and references ('it', 'that card', 'the hero', 'le vert') to their original entity names\n- Carry forward topic context: if the conversation was about patch changes and the user asks a follow-up ('c\\'était combien avant?', 'and before?'), the topic is still patch-related\n- Inherit needsGameData/needsPatchNotes from the conversation topic when the follow-up message is clearly continuing the same discussion"
    : "";

  return `Classify this Twitch/Discord chat message. Return JSON only.${historyInstruction}
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

const intentSchema = buildSchema();
const defaultIntent = buildDefaultIntent();

const MAX_HISTORY_MESSAGES = 6;

export class IntentCore {
  private mistral: Mistral;
  private model: string = "mistral-small-latest";

  constructor(mistral: Mistral) {
    this.mistral = mistral;
  }

  async classify(message: string, history: ChatMessage[] = []): Promise<IntentClassification> {
    try {
      const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
      const hasHistory = recentHistory.length > 0;
      const intentPrompt = buildPrompt(hasHistory);

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: intentPrompt },
        ...recentHistory.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      const response = await this.mistral.chat.parse({
        model: this.model,
        messages,
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
