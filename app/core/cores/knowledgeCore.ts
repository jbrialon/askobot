import Fuse from "fuse.js";
import { communityMembers, type CommunityMember } from "../tapes/knowledgeTape.ts";

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

export class KnowledgeCore {
  private members: CommunityMember[];
  private fuzzyThreshold: number;

  constructor() {
    this.members = communityMembers;
    this.fuzzyThreshold = 0.3;
  }

  /**
   * Filters community members by fuzzy matching user and message content
   * Returns only members mentioned in the conversation
   */
  private filterCommunityByMention(user: string, message: string): CommunityMember[] {
    const fuse = new Fuse(this.members, {
      keys: ["name", "alias", "keywords"],
      threshold: this.fuzzyThreshold,
      includeScore: true,
    });

    // Combine user and message, split into words, and search for each word
    const searchText = `${user} ${message}`;
    const words = searchText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const matchedMembers = new Set<CommunityMember>();

    for (const word of words) {
      const results = fuse.search(word);
      results.forEach((result) => matchedMembers.add(result.item));
    }

    return Array.from(matchedMembers);
  }

  /**
   * Finds the streamer for a given channel by matching channel name with member name/aliases
   */
  private findStreamer(channel: string): CommunityMember | undefined {
    return this.members.find(
      (member) => member.name.toLowerCase() === channel.toLowerCase() || member.alias.some((alias) => alias.toLowerCase() === channel.toLowerCase()),
    );
  }

  /**
   * Builds the streamer XML section for the prompt
   */
  buildStreamer(channel: string): string {
    const streamer = this.findStreamer(channel);

    if (!streamer) {
      return ""; // No streamer found for this channel
    }

    const randomDescription = streamer.descriptions[Math.floor(Math.random() * streamer.descriptions.length)];
    const aliasAttr = streamer.alias.length > 0 ? ` aliases="${streamer.alias.join(", ")}"` : "";

    return `
    <streamer name="${streamer.name}"${aliasAttr}>
      ${randomDescription}
    </streamer>`;
  }

  /**
   * Builds the community XML section for the prompt
   * Optionally filters by user and message to only include relevant members
   * Excludes the streamer from the community list
   */
  buildCommunity(channel: string, user?: string, message?: string): string {
    const streamer = this.findStreamer(channel);
    let members = user && message ? this.filterCommunityByMention(user, message) : this.members;

    // Exclude streamer from community members
    if (streamer) {
      members = members.filter((member) => member.name !== streamer.name);
    }

    if (members.length === 0) {
      return ""; // No community members mentioned
    }

    const communityXml = members
      .map((member) => {
        const randomDescription = member.descriptions[Math.floor(Math.random() * member.descriptions.length)];

        const aliasAttr = member.alias.length > 0 ? ` aliases="${member.alias.join(", ")}"` : "";

        return `<member name="${member.name}"${aliasAttr}>
        ${randomDescription}
      </member>`;
      })
      .join("\n");

    return `
    <community>
${communityXml}
    </community>`;
  }
}

// Singleton instance
const knowledgeCore = new KnowledgeCore();
export default knowledgeCore;
