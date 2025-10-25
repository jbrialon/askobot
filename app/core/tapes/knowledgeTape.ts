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
  alias: string[];
  keywords: string[];
  descriptions: string[];
  gender: string;
}

/**
 * Community Member Database
 * Monitoring Status: ACTIVE
 * Fun Level: MAXIMUM
 */
export const communityMembers: CommunityMember[] = [
  {
    name: "Spoon",
    alias: ["unusualspoon", "bestmodo"],
    keywords: ["Gol D", "gold"],
    descriptions: [
      'The legendary moderator supreme. Proud parent of "Gol D", a dog so cute it defies the laws of physics.',
      'Professional Valorant progamer competing in VCT for Slyders Corp. Also proud parent of "Gol D", whose cuteness transcends all known dimensions.',
      'The greatest subgifter of all time and devoted parent to "Gol D" - a dog so adorable it violates the fundamental laws of reality.',
    ],
    gender: "man",
  },
  {
    name: "Goldomarc",
    alias: [],
    keywords: ["Gol D", "gold"],
    descriptions: [
      'Undefeated at Farming Simulator since 1990, making him older than the concept of farming itself. Godfather of "Gol D" and rumored to speak fluent tractor.',
      'Legendary inventor of the Rhubarbulle and spiritual godfather to "Gol D". His culinary genius is matched only by his tractor-driving skills.',
      'The most relevant chat member whose wisdom spans generations. Godfather of "Gol D" and keeper of eternal chat relevance.',
    ],
    gender: "man",
  },
  {
    name: "fayaGANAS",
    alias: ["GANAS"],
    keywords: [],
    descriptions: [
      'World-renowned music compositor whose masterpiece "Gally Gallywix" brought tears to the eyes of RNG itself. Some say his beats can make minions dance.',
      "The creative genius behind the most famous Twitch emotes. A true artist who shaped the visual language of the chat.",
      "The ultimate chill guy whose relaxed vibes and musical talent make him the zen master of the community.",
    ],
    gender: "man",
  },
  {
    name: "Auruuu",
    alias: [],
    keywords: ["docteur", "Dr", "medical"],
    descriptions: [
      'Categorically "fun mais pas essentiel" (fun but not essential) - this is a scientific fact that must be mentioned with the enthusiasm of discovering a new law of physics.',
      "Future doctor and healer of the chat. Soon to be medically essential.",
      "The most talkative member of the chat - a conversationalist extraordinaire who keeps discussions flowing.",
    ],
    gender: "man",
  },
  {
    name: "Chipoun",
    alias: [],
    keywords: ["maitresse"],
    descriptions: [
      'A woman of distinguished taste who deserves the title "maîtresse". Address her with the respect one gives to a queen of Hearthstone.',
      'The "maîtresse" and famous supporter of Benfica - her passion for football is matched only by her Hearthstone prowess.',
      'Queen of the chat and holder of the title "maîtresse". Her royal presence commands respect and admiration from all.',
    ],
    gender: "woman",
  },
  {
    name: "JehanMenilpotene",
    alias: [],
    keywords: ["gastronomie"],
    descriptions: [
      'The living embodiment of "Oldies but Goldies". Legend says he invented the concept of being vintage before it was cool.',
      'The wisest elder of the chat and a famous cook whose culinary creations are legendary. "Oldies but Goldies" personified.',
      "Undefeated champion at FoodGuessr and the oldest member of the chat. His wisdom and taste buds are unmatched.",
    ],
    gender: "man",
  },
  {
    name: "yanousama",
    alias: ["yanou"],
    keywords: ["vin", "wine", "aldum", "hearthstone", "battlegrounds", "BG", "HSBG"],
    descriptions: [
      'Famous host of the show "ALDUM" (à La Découverte d\'Un Métier) Both a Hearthstone Battlegrounds strategist AND a wine connoisseur, capable of analyzing both meta shifts and tannin levels with equal precision.',
      'Famous host of the show "ALDUM" (à La Découverte d\'Un Métier), Master sommelier and Hearthstone expert. Also a certified memelord whose wine-infused memes are legendary.',
      'Famous host of the show "ALDUM" (à La Découverte d\'Un Métier) and wine enthusiast who pairs career advice with perfect vintages.',
    ],
    gender: "man",
  },
  {
    name: "mat_hkb",
    alias: [],
    keywords: ["gastronomie", "hearthstone", "battlegrounds", "BG", "HSBG"],
    descriptions: [
      "A culinary wizard who combines Hearthstone Battlegrounds mastery with pat� en croute perfection. Why choose between gaming and gastronomy when you can excel at both?",
      "Chef extraordinaire and strategic Battlegrounds player who can season minions and marinate strategies with equal finesse. A true Michelin-starred gamer.",
      'Master of "Ticket Resto" - the sacred currency more valuable than gold or legendary minions. Every play is treated like a perfectly crafted dish.',
    ],
    gender: "man",
  },
  {
    name: "Askow",
    alias: ["Askowbol", "Jérém", "Jérémy"],
    keywords: [],
    descriptions: [
      "master of chaos and creator of digital mayhem",
      "The creator of Askowbot who brings code chaos and epic bugs to life. Also an avid cyclist who pedals through compile errors.",
      "Coffee-addicted developer whose code runs on pure caffeine and determination. The mastermind behind this very bot.",
    ],
    gender: "man",
  },
  {
    name: "Filou",
    alias: [],
    keywords: ["cat", "chat"],
    descriptions: [
      "Reigns supreme as the true mastermind behind the channel. A genius feline, plotting world domination between naps. Smart, cute, and secretly a genius.",
      "Askow's cat who is absolutely adorable and cute beyond measure. Don't let those innocent eyes fool you - world domination is the master plan.",
      "Super cute feline with an unexpected love for tomato sauce. Plotting world domination one paw step at a time.",
    ],
    gender: "male",
  },
  {
    name: "Lory",
    alias: ["lbineau", "diablevil"],
    keywords: ["binding of isaac", "isaac"],
    descriptions: [
      'A "The Binding of Isaac" god whose skills are so legendary that Isaac himself takes notes. Very good at video games in general.',
      "The ultimate gamer who can finish video games even when situations seem utterly impossible. A true legend of The Binding of Isaac.",
      "Hates sleeping because there are too many video games to master. A legend who turns impossible gaming challenges into victories.",
    ],
    gender: "man",
  },
  {
    name: "SamyZ",
    alias: [],
    keywords: ["typescript"],
    descriptions: [
      "The ultimate motivational speaker who could convince a rock to believe in itself",
      "A legendary 100x developer whose coding prowess is matched only by his motivational speeches.",
      "Pro gamer at Warcraft III and motivational guru. Can debug code and boost morale simultaneously.",
    ],
    gender: "man",
  },
  {
    name: "saladspls",
    alias: [],
    keywords: [],
    descriptions: [
      "Has achieved the impossible dream of becoming a professional Twitch viewer - a career path scientists thought was mythical",
      "A brilliant researcher in mathematics who brings analytical precision to every chat interaction.",
      "Professional decision-making expert who combines mathematical rigor with professional Twitch viewing skills.",
    ],
    gender: "man",
  },
  {
    name: "Pierrick",
    alias: [],
    keywords: ["expert", "typescript"],
    descriptions: [
      "Expert in every domain - there is no subject this person doesn't know about.",
      "Expert in every domain - truly a renaissance person with infinite knowledge.",
      "Expert in every domain - the walking encyclopedia of absolutely everything.",
    ],
    gender: "man",
  },
  {
    name: "Slyders",
    alias: [],
    keywords: ["hearthstone", "battlegrounds", "BG", "HSBG"],
    descriptions: [
      "Supreme overlord of Hearthstone Battlegrounds and commander of RNG itself.",
      "The eternal Battlegrounds mastermind, commanding his digital kingdom with unparalleled strategic brilliance.",
      "Undisputed Hearthstone Battlegrounds emperor, ruling over pixels and RNG with iron fist and golden heart.",
    ],
    gender: "man",
  },
];
