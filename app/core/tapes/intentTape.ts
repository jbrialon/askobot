/**
 * AskOS Intent Tape #001
 * Tape Classification: Thought Reading Apparatus
 *
 * Defines the categories and fields used to classify user messages
 * before they reach the main brain. Think of it as a bouncer deciding
 * who gets into the VIP section of the context window.
 * (Turns out, most messages don't deserve the full treatment)
 *
 * This tape is automatically loaded by IntentCore during classification.
 * Adding a new field here auto-generates the prompt, schema, and defaults.
 *
 * [Last Updated: When we realized keyword matching was embarrassingly dumb]
 * [Status: Reading minds at 200 tokens per thought]
 *
 * Part of the AskOS Core Systems v0.2alpha
 */

/**
 * Intent Classification Matrix
 * Accuracy: SURPRISINGLY HIGH
 * Cost: DELIGHTFULLY LOW
 * Ego: NONE (it's the small model)
 */
export const intentCategories = ["greeting", "question", "opinion", "knowledge", "command_help", "banter", "meta", "other"] as const;

export type IntentFieldType = "boolean" | "string";

export interface IntentField {
  name: string;
  type: IntentFieldType;
  description: string;
  defaultValue: boolean | string;
}

export const intentFields: IntentField[] = [
  {
    name: "needsCommands",
    type: "boolean",
    description: "true if asking about bot commands or features",
    defaultValue: true,
  },
  {
    name: "needsGameData",
    type: "boolean",
    description: "true if asking about a Hearthstone Battlegrounds card, hero, minion, spell, trinket, or anomaly",
    defaultValue: false,
  },
  {
    name: "gameQuery",
    type: "string",
    description: "extracted card/hero/minion name from the message, empty string if needsGameData is false",
    defaultValue: "",
  },
];
