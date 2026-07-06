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
      "true if the message mentions a SPECIFIC card/hero/minion/spell/trinket/anomaly BY NAME or reference, OR asks about a tribe/tier category (e.g. 'les nagas t6', 'combien de dragons'). Use conversation history to resolve references ('it', 'that card'). false for general questions about the game, strategy, or categories without tribe/tier (e.g. 'what is the best hero?' → false, 'do some heroes appear less often?' → false). When true, either gameQuery OR gameTribe must be set",
    defaultValue: false,
  },
  {
    name: "gameQuery",
    type: "string",
    description:
      "the specific entity name extracted from the message OR resolved from conversation history. If the user refers to a previously discussed entity with pronouns ('it', 'that', 'the card') or implicit references ('how much before?'), resolve the reference and return the original entity name. Must be ONLY the card/hero/spell proper name — strip all qualifiers: no 'doré'/'golden', no type words ('elemental', 'beast', 'mech'), no 'en or', no 'buddy de'. Translate synonyms to canonical names: 'chrono'/'chronodistordu' → 'Timewarp'. Examples: 'ça fait quoi mastodonte en doré' → 'Mastodonte', 'vineclimber elemental card' → 'Vineclimber', 'c'est quoi le buddy de xyrella' → 'Xyrella', 'le timewarp ragnaros' → 'Timewarp Ragnaros', 'le chrono ragnaros' → 'Timewarp Ragnaros'. Must be a proper name, NOT a generic word like 'héro', 'carte', 'sort', 'minion', 'meilleur héro'. Empty string if needsGameData is false, no specific name can be resolved, or gameTribe is set (tribe queries don't need a card name)",
    defaultValue: "",
  },
  {
    name: "gameTribe",
    type: "string",
    description:
      "the minion tribe/type extracted from the message. Must be one of these exact values: NONE, UNDEAD, QUILBOAR, BEAST, ELEMENTAL, MECH, PIRATE, MURLOC, DEMON, DRAGON, ALL, NAGA. NONE = neutral/tribeless minion, ALL = amalgam (counts as every tribe). If multiple tribes are mentioned, comma-separate them (e.g. 'NAGA,DRAGON'). Match common synonyms and slang: 'ud'/'mort-vivant' → UNDEAD, 'huran' → QUILBOAR, 'bête' → BEAST, 'élémentaire' → ELEMENTAL, 'méca' → MECH, 'démon' → DEMON, 'neutre' → NONE, 'amalgame'/'tout type' → ALL. Empty string if no tribe mentioned",
    defaultValue: "",
  },
  {
    name: "gameTier",
    type: "string",
    description:
      "the tavern tier extracted from the message (1-7), from expressions like 't6', 'tier 3', 'niveau 5', 'taverne 4'. Empty string if no tier mentioned",
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
