import Fuse from "fuse.js";
import { communityMembers } from "../tapes/knowledgeTape.ts";

/**
 * KnowledgeCore - AskOS Community Intelligence Module
 *
 * Maintains comprehensive records of all community members and their quirks.
 * Uses fuzzy matching to identify mentions because humans can't spell consistently.
 * Optimizes context by only including relevant members. (Finally, efficiency!)
 *
 * [Note: All community descriptions are 100% factual and not exaggerated at all]
 * [Warning: Low match threshold may result in excessive enthusiasm about members]
 * Part of the AskOS Core Systems v0.1alpha
 */

function filterCommunityByMention(user: string, message: string): typeof communityMembers {
  const fuse = new Fuse(communityMembers, {
    keys: ["name", "alias"],
    threshold: 0.3,
    includeScore: true,
  });

  // Combine user and message, split into words, and search for each word
  const searchText = `${user} ${message}`;
  const words = searchText
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const matchedMembers = new Set<(typeof communityMembers)[number]>();

  for (const word of words) {
    const results = fuse.search(word);
    results.forEach((result) => matchedMembers.add(result.item));
  }

  return Array.from(matchedMembers);
}

/**
 * Builds the community XML section for the prompt
 * Optionally filters by user and message to only include relevant members
 */
export function buildCommunity(user?: string, message?: string): string {
  const members = user && message ? filterCommunityByMention(user, message) : communityMembers;

  if (members.length === 0) {
    return ""; // No community members mentioned
  }

  const communityXml = members
    .map((member) => {
      const randomDescription = member.description[Math.floor(Math.random() * member.description.length)];

      const aliasAttr = member.alias.length > 0 ? ` aliases="${member.alias.join(", ")}"` : "";

      return `      <member name="${member.name}"${aliasAttr}>
        ${randomDescription}
      </member>`;
    })
    .join("\n");

  return `
    <community>
${communityXml}
    </community>`;
}
