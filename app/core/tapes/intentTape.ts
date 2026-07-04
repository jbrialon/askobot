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
export const intentCategories = ["question", "opinion", "command_help", "banter", "react", "system", "other"] as const;

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
    description:
      "true ONLY if the message mentions OR REFERS TO a SPECIFIC card, hero, minion, spell, trinket, or anomaly BY NAME or by reference (e.g. 'it', 'that card', 'the hero' referring to a previously mentioned entity). Use conversation history to resolve references. false for general questions about the game, strategy, or categories — even when they mention generic terms like 'héros', 'cartes', 'sorts' (e.g. 'what is the best hero?' → false, 'do some heroes appear less often?' → false, 'what does X do?' where X is a specific name → true, 'but how much was it before?' when 'it' refers to a previously discussed card → true). If this is true, gameQuery MUST contain the resolved entity name — never set needsGameData=true with an empty gameQuery",
    defaultValue: false,
  },
  {
    name: "gameQuery",
    type: "string",
    description:
      "the specific entity name extracted from the message OR resolved from conversation history. If the user refers to a previously discussed entity with pronouns ('it', 'that', 'the card') or implicit references ('how much before?'), resolve the reference and return the original entity name. Must be ONLY the card/hero/spell proper name — strip all qualifiers: no 'doré'/'golden', no type words ('elemental', 'beast', 'mech'), no 'en or', no 'buddy de'. Examples: 'ça fait quoi mastodonte en doré' → 'Mastodonte', 'vineclimber elemental card' → 'Vineclimber', 'c'est quoi le buddy de xyrella' → 'Xyrella', 'le timewarp ragnaros' → 'Timewarp Ragnaros'. Must be a proper name, NOT a generic word like 'héro', 'carte', 'sort', 'minion', 'meilleur héro'. Empty string if needsGameData is false or no specific name can be resolved",
    defaultValue: "",
  },
  {
    name: "needsPatchNotes",
    type: "boolean",
    description:
      "true if the message asks about or continues a conversation about a recent patch, update, nerf, buff, balance change, or new content. Also true when the user asks about previous values, old stats, or what something was 'before'/'avant' — these imply comparing current vs. previous patch data. Use conversation history to detect ongoing patch discussions",
    defaultValue: false,
  },
];
