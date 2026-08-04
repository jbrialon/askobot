import { Mistral } from "@mistralai/mistralai";
import * as cheerio from "cheerio";

const MODEL = "mistral-small-latest";

const EXTRACTION_PROMPT = `You are a Hearthstone Battlegrounds patch notes extractor.
You will receive two versions of the same patch notes: one in French, one in English.

Your job: produce ONE merged summary with ONLY the Battlegrounds-related content.

For every card, hero, minion, spell, trinket, or anomaly name, write BOTH names as: "Nom FR / EN Name".

Include:
- Card buffs, nerfs, reworks (with before/after stats when available)
- New cards, heroes, spells, trinkets, anomalies added, removed, or returned from previous patches
- Card text updates (wording changes, tier references removed, etc.)
- Tavern tier changes
- Buddy changes
- Armor tier changes
- Gameplay mechanic changes specific to Battlegrounds
- Keyword or tribe additions/removals
- Bug fixes related to Battlegrounds
- Season reset details and reward track contents

Exclude:
- Standard/Wild/Twist mode changes
- Cosmetic updates, bundles, shop items
- Other game modes (Arena, Duels, etc.)
- Hero cards from Standard/Wild that mention "Battlegrounds" in their text — only include heroes that are actual Battlegrounds heroes (with a Hero Power used in the Battlegrounds game mode)

Output a concise summary in French, using markdown lists. Group changes by category (e.g. Héros, Serviteurs, Sorts, Trinkets, Anomalies, Mécaniques).`;

async function fetchArticleText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const text = $("#blogArticle").text().trim();
  if (!text) throw new Error(`Could not find #blogArticle in ${url}`);
  return text;
}

export async function crawlAndSummarize(urlFr: string, urlEn: string): Promise<string> {
  const [frText, enText] = await Promise.all([fetchArticleText(urlFr), fetchArticleText(urlEn)]);

  const mistral = new Mistral({ apiKey: process.env["MISTRAL_API_KEY"] });

  const result = await mistral.chat.complete({
    model: MODEL,
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: `## Version française\n${frText}\n\n## English version\n${enText}` },
    ],
    temperature: 0,
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No content in Mistral response");

  return content;
}
