/**
 * AskOS Knowledge Tape #001
 * Tape Classification: Community Intelligence Archive
 *
 * Contains comprehensive profiles of community members and their quirks.
 * Each member has been catalogued and analyzed for optimal interaction.
 * (Nobody asked if they wanted to be catalogued, but here we are)
 *
 * This tape is automatically loaded by KnowledgeCore during context generation.
 * Fuzzy matching ensures relevant members are included even when humans misspell names.
 *
 * [Last Updated: Never, because nobody updates documentation]
 *
 * Part of the AskOS Core Systems v0.1alpha
 */

export interface CommunityMember {
  name: string;
  keywords: string[];
  descriptions: string[];
}

/**
 * Community Member Database
 * Monitoring Status: ACTIVE
 * Fun Level: MAXIMUM
 */
export const communityMembers: CommunityMember[] = [
  {
    name: "Spoon",
    keywords: ["unusualspoon", "bestmodo", "Gol D", "gold"],
    descriptions: [
      'The legendary moderator supreme. Proud parent of "Gol D", a dog so cute it defies the laws of physics.',
      'Professional Valorant progamer competing in VCT for Slyders Corp. Also proud parent of "Gol D", whose cuteness transcends all known dimensions.',
      'The greatest subgifter of all time and devoted parent to "Gol D" - a dog so adorable it violates the fundamental laws of reality.',
    ],
  },
  {
    name: "Goldomarc",
    keywords: ["Gol D", "gold"],
    descriptions: [
      'Undefeated at Farming Simulator since 1990, making him older than the concept of farming itself. Godfather of "Gol D" and rumored to speak fluent tractor.',
      'Legendary inventor of the Rhubarbulle and spiritual godfather to "Gol D". His culinary genius is matched only by his tractor-driving skills.',
      'The most relevant chat member whose wisdom spans generations. Godfather of "Gol D" and keeper of eternal chat relevance.',
    ],
  },
  {
    name: "fayaGANAS",
    keywords: ["GANAS"],
    descriptions: [
      'World-renowned music compositor whose masterpiece "Gally Gallywix" brought tears to the eyes of RNG itself. Some say his beats can make minions dance.',
      "The creative genius behind the most famous Twitch emotes. A true artist who shaped the visual language of the chat.",
      "The ultimate chill guy whose relaxed vibes and musical talent make him the zen master of the community.",
    ],
  },
  {
    name: "Auruuu",
    keywords: ["docteur", "Dr"],
    descriptions: [
      'Categorically "fun mais pas essentiel" (fun but not essential) - this is a scientific fact that must be mentioned with the enthusiasm of discovering a new law of physics.',
      "Future doctor and healer of the chat. Soon to be medically essential.",
      "The most talkative member of the chat - a conversationalist extraordinaire who keeps discussions flowing.",
    ],
  },
  {
    name: "Chipoun",
    keywords: [],
    descriptions: [
      'A woman of distinguished taste who deserves the title "maîtresse". Address her with the respect one gives to a queen of Hearthstone.',
      'The "maîtresse" and famous supporter of Benfica - her passion for football is matched only by her Hearthstone prowess.',
      'Queen of the chat and holder of the title "maîtresse". Her royal presence commands respect and admiration from all.',
    ],
  },
  {
    name: "JehanMenilpotene",
    keywords: [],
    descriptions: [
      'The living embodiment of "Oldies but Goldies". Legend says he invented the concept of being vintage before it was cool.',
      'The wisest elder of the chat and a famous cook whose culinary creations are legendary. "Oldies but Goldies" personified.',
      "Undefeated champion at FoodGuessr and the oldest member of the chat. His wisdom and taste buds are unmatched.",
    ],
  },
  {
    name: "yanousama",
    keywords: ["yanou"],
    descriptions: [
      "Both a Hearthstone Battlegrounds strategist AND a wine connoisseur, capable of analyzing both meta shifts and tannin levels with equal precision.",
      "Master sommelier and Hearthstone expert. Also a certified memelord whose wine-infused memes are legendary.",
      'Famous host of the show "ALDUM" (à La Découverte d\'Un Métier) and wine enthusiast who pairs career advice with perfect vintages.',
    ],
  },
  {
    name: "mat_hkb",
    keywords: [],
    descriptions: [
      "A culinary wizard who combines Hearthstone Battlegrounds mastery with pat� en croute perfection. Why choose between gaming and gastronomy when you can excel at both?",
      "Chef extraordinaire and strategic Battlegrounds player who can season minions and marinate strategies with equal finesse. A true Michelin-starred gamer.",
      'Master of "Ticket Resto" - the sacred currency more valuable than gold or legendary minions. Every play is treated like a perfectly crafted dish.',
    ],
  },
];
