import fetch from "node-fetch";
import Fuse from "fuse.js";

import { MemoryCache } from "../classes/memory-cache.js";
import { getValidToken, cleanText } from "./utils.js";

const VALID_REGIONS = ["EU", "US", "AP"];
const PLAYERS_PER_PAGE = 25;
const TOP_PAGES = 8;
const CURRENT_BG_SEASON = 18;
const CURRENT_ARENA_SEASON = 4;
const cache = new MemoryCache();

export const CARD_TYPES = {
  HERO: 3,
  MINION: 4,
  HERO_POWER: 10,
  SPELL: 42,
  ANOMALY: 43,
  TRINKET: 44,
  COMPANION: 45,
  REWARD: 40,
  TIMEWARP: 999,
};

export const MINION_TYPES = {
  NONE: 0,
  UNDEAD: 11,
  MURLOC: 14,
  DEMON: 15,
  MECH: 17,
  ELEMENTAL: 18,
  BEAST: 20,
  PIRATE: 23,
  DRAGON: 24,
  ALL: 26,
  QUILBOAR: 43,
  NAGA: 92,
};

export const LEADERBOARD_TYPES = {
  BATTLEGROUNDS: "battlegrounds",
  BATTLEGROUNDS_DUO: "battlegroundsduo",
  ARENA: "undergroundarena",
};

/**
 * Loads card data from the /api/cards endpoint
 * Prevents duplicate concurrent requests but always fetches fresh data
 */
// Promise to track ongoing card data fetch (prevents duplicate concurrent requests)
let cardsLoadPromise = null;

const loadCardData = async () => {
  // If already fetching, return the existing promise
  if (cardsLoadPromise !== null) {
    return cardsLoadPromise;
  }

  // Create new fetch promise
  cardsLoadPromise = (async () => {
    try {
      let apiUrl = process.env["APP_URL"];

      // In development, append the port to the URL
      if (process.env["APP_ENV"] === "development") {
        const port = process.env["APP_PORT"];
        apiUrl = `${apiUrl}:${port}`;
      }

      const response = await fetch(`${apiUrl}/api/cards`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error loading card data:", error);
      throw error;
    } finally {
      cardsLoadPromise = null;
    }
  })();

  return cardsLoadPromise;
};

/**
 * Finds a player in the leaderboard by their account ID
 * @param {Array<Object>} allPlayers - Array of all player objects from the leaderboard
 * @param {string} accountId - The account ID to search for
 */
const findRankByAccountId = (allPlayers, accountId) => {
  // Find the player object that matches the accountId
  const player = allPlayers.find((player) => player.accountid.toLowerCase() === accountId.toLowerCase());

  // If a player is found, return the player object, otherwise return null
  return player ? player : null;
};

/**
 * Fetches data from a URL and returns the JSON response
 * @param {string} url - The URL to fetch data from
 * @throws {Error} If the HTTP request fails
 */
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
    throw error;
  }
};

/**
 * Fetches leaderboard data for a specific player by rank number or account ID
 * @param {Array<string>} args - Array containing [playerRankOrAccountId, region]
 * @param {string} [leaderboardType=LEADERBOARD_TYPES.BATTLEGROUNDS] - Type of leaderboard to query
 * @description
 * - First parameter can be a rank number (1-based) or an account ID
 * - Second parameter is the region (EU, US, AP). Defaults to EU if not provided
 * - Results are cached to improve performance
 */
export const fetchLeaderboardData = async (args, leaderboardType = LEADERBOARD_TYPES.BATTLEGROUNDS) => {
  const paramOne = args[0];
  let paramTwo = args[1];

  const cacheKey = [paramOne, paramTwo, leaderboardType];
  const cachedLeaderboardData = cache.get(cacheKey);
  if (cachedLeaderboardData) {
    console.log("Cache hit");
    return cachedLeaderboardData;
  }

  // Normalize paramTwo by capitalizing it, and handle the case when paramTwo doesn't exist
  paramTwo = paramTwo ? paramTwo.toUpperCase() : "";

  // Special case: if paramTwo is 'NA', treat it as 'US'
  if (paramTwo === "NA") {
    paramTwo = "US";
  }

  // Check if paramTwo is a valid region, otherwise default to 'EU'
  const region = VALID_REGIONS.includes(paramTwo) ? paramTwo : "EU";

  // Get the correct season ID based on leaderboard type
  const seasonId = leaderboardType === LEADERBOARD_TYPES.ARENA ? CURRENT_ARENA_SEASON : CURRENT_BG_SEASON;

  // Attempt to parse paramOne as a number
  const playerRankNumber = Number(paramOne);

  if (!isNaN(playerRankNumber)) {
    try {
      // paramOne is a number (index), return the player at that index
      const playerIndex = playerRankNumber - 1; // Adjust for 1-based indexing
      const playerPage = Math.ceil(playerRankNumber / PLAYERS_PER_PAGE);

      const playerPageUrl = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardType}&seasonId=${seasonId}&page=${playerPage}`;
      const playerPageData = await fetchData(playerPageUrl);
      const playerIndexInPage = playerIndex % PLAYERS_PER_PAGE;
      const player = playerPageData?.leaderboard?.rows?.[playerIndexInPage] || null; // Return null if index is out of range

      if (player) {
        cache.set(cacheKey, player);
        return player;
      }
    } catch (error) {
      console.error("Error finding player by rank number:", error);
      return null;
    }
  }
  // paramOne is an account ID (string), find the rank by account ID
  try {
    let pageIndex = 1;
    let pagesRemaining = true;
    // we only fetch the first 8 pages as it's in the top 200 players, the rest we will go through the slow method
    while (pageIndex <= TOP_PAGES && pagesRemaining) {
      const pageUrl = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardType}&seasonId=${seasonId}&page=${pageIndex}`;
      const pageData = await fetchData(pageUrl);

      const players = pageData?.leaderboard?.rows || [];
      const leaderboardData = findRankByAccountId(players, paramOne);
      if (leaderboardData) {
        cache.set(cacheKey, leaderboardData);
        return leaderboardData;
      }
      // we have not found the player, so we need to fetch the next pages, checking if there are some
      const totalPages = pageData?.leaderboard?.pagination?.totalPages || 1;
      if (totalPages <= pageIndex) {
        pagesRemaining = false;
      }
      pageIndex++;
    }
  } catch (error) {
    console.error("Error finding player by account ID:", error);
  }

  // manual method, we should never reach this for a call by rank number
  console.log("Fallback method, fetching all pages");
  let allPlayers = [];
  let MAX_PAGES = 1; // Default value before the first API call

  try {
    // Fetch the first page to determine the total number of pages
    const firstPageUrl = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardType}&seasonId=${seasonId}&page=1`;
    const firstPageData = await fetchData(firstPageUrl);

    // Update MAX_PAGES based on the totalPages in the API response
    if (firstPageData && firstPageData.leaderboard && firstPageData.leaderboard.pagination) {
      MAX_PAGES = firstPageData.leaderboard.pagination.totalPages;
    }

    // Add the first page of players to the list
    if (firstPageData.leaderboard && firstPageData.leaderboard.rows) {
      allPlayers = allPlayers.concat(firstPageData.leaderboard.rows);
    }

    // Generate promises for remaining pages, if any
    const promises = [];
    for (let page = 2; page <= MAX_PAGES; page++) {
      const url = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardType}&seasonId=${seasonId}&page=${page}`;
      promises.push(fetchData(url));
    }

    // Execute all remaining promises simultaneously and process results
    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result && result.leaderboard && result.leaderboard.rows) {
        allPlayers = allPlayers.concat(result.leaderboard.rows);
      }
    });

    if (!isNaN(playerRankNumber)) {
      // paramOne is a number (index), return the player at that index
      const index = playerRankNumber - 1; // Adjust for 1-based indexing
      const player = allPlayers[index] || null; // Return player or null if index is out of range
      if (player) {
        cache.set(cacheKey, player);
      }
      return player;
    } else if (typeof paramOne === "string") {
      // paramOne is an account ID (string), find the rank by account ID
      const leaderboardData = findRankByAccountId(allPlayers, paramOne);
      if (leaderboardData) {
        cache.set(cacheKey, leaderboardData);
      }
      return leaderboardData;
    } else {
      console.error("Invalid paramOne type. Must be a string (account ID) or a number (index).");
      return null;
    }
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
  }
};

/**
 * Searches for a card by name using fuzzy matching
 * @param {string} cardName - The name of the card to search for (supports French and English)
 * @param {number} type - The card type to filter by (use CARD_TYPES constants)
 * @description
 * - Uses Fuse.js for fuzzy string matching with a threshold of 0.3
 * - Searches in both French and English card names
 * - Filters cards by type before searching for better accuracy
 */
export const fetchCardData = async (cardName, type, threshold = 0.3) => {
  // Ensure card data is loaded
  const cardData = await loadCardData();

  // search keys based on card type
  let searchKeys = ["name.en", "name.fr"];

  // don't look up for buddies when looking for heroes (some share the same name)
  if (type !== CARD_TYPES.HERO) {
    searchKeys.push("companion.name");
  }

  const options = {
    keys: searchKeys,
    threshold, // Lower threshold means stricter matches
    includeScore: true, // Include match score for sorting
  };

  // Filter cards based on type (undefined = search all cards)
  let dataset;
  switch (type) {
    case CARD_TYPES.HERO:
      dataset = cardData.filter((card) => card.battlegrounds?.hero === true && !card.battlegrounds?.quest && !card.battlegrounds?.reward);
      break;
    case CARD_TYPES.TRINKET:
      dataset = cardData.filter((card) => card.battlegrounds?.trinket === true);
      break;
    case CARD_TYPES.ANOMALY:
      dataset = cardData.filter((card) => card.battlegrounds?.anomaly === true);
      break;
    case CARD_TYPES.SPELL:
      dataset = cardData.filter((card) => card.battlegrounds?.spell === true);
      break;
    case CARD_TYPES.REWARD:
      dataset = cardData.filter((card) => card.battlegrounds?.reward === true);
      break;
    case CARD_TYPES.TIMEWARP:
      dataset = cardData.filter((card) => card.battlegrounds?.timewarp === true);
      break;
    case undefined:
      dataset = cardData;
      break;
    default:
      const minionCards = cardData.filter(
        (card) =>
          !card.battlegrounds?.hero &&
          !card.battlegrounds?.quest &&
          !card.battlegrounds?.reward &&
          !card.battlegrounds?.trinket &&
          !card.battlegrounds?.anomaly &&
          !card.battlegrounds?.spell &&
          !card.battlegrounds?.timewarp,
      );
      const heroesWithCompanions = cardData.filter((card) => card.battlegrounds?.hero === true && card.companion);
      dataset = [...minionCards, ...heroesWithCompanions];
  }

  // Initialize Fuse.js
  const fuse = new Fuse(dataset, options);

  // Perform the search
  const results = fuse.search(cardName);

  if (results.length === 0) {
    return null; // No matches
  }

  // Return the best match
  return results[0].item;
};

export const searchCardsByTribe = async (tribeName, tier) => {
  const cardData = await loadCardData();
  const tribeIds = tribeName
    .split(",")
    .map((t) => MINION_TYPES[t.trim()])
    .filter((id) => id !== undefined);

  if (tribeIds.length === 0) return [];

  return cardData.filter((card) => {
    if (card.cardTypeId !== CARD_TYPES.MINION) return false;

    const matchesTribe = tribeIds.some((tribeId) => card.minion?.typeId === tribeId || card.minion?.multiTypeIds?.includes(tribeId));

    if (!matchesTribe) return false;

    if (tier) {
      return card.minion?.tier === Number(tier);
    }

    return true;
  });
};

export const searchCards = async (cardName, threshold = 0.3, limit = 3) => {
  const cardData = await loadCardData();

  const fuse = new Fuse(cardData, {
    keys: ["name.en", "name.fr", "companion.name"],
    threshold,
    includeScore: true,
  });

  const results = fuse.search(cardName);
  if (results.length === 0) return [];

  return results.slice(0, limit).map((r) => ({ card: r.item, score: r.score }));
};

/**
 * Fetches all Battlegrounds card data from the Blizzard API
 * @description
 * - Fetches cards in both French and English locales
 * - Merges card data by slug to combine translations
 * - Includes companion, upgrade (golden), and hero power data
 */
export const fetchAllCardData = async () => {
  const token = await getValidToken();
  const baseUrls = [
    `https://eu.api.blizzard.com/hearthstone/cards?locale=fr_FR&gameMode=battlegrounds`,
    `https://eu.api.blizzard.com/hearthstone/cards?locale=en_US&gameMode=battlegrounds`,
  ];

  let allCards = [];
  let currentPages = [1, 1]; // Tracks the page for each locale

  try {
    while (true) {
      const responses = await Promise.all(
        baseUrls.map((baseUrl, index) =>
          fetch(`${baseUrl}&page=${currentPages[index]}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ),
      );

      const data = await Promise.all(responses.map((response) => response.json()));
      const localeResults = await Promise.all(
        data.map(async (localeData, localeIndex) => {
          const localeCards = localeData.cards || [];
          return Promise.all(
            localeCards.map(async (card) => {
              let { slug, name, text, childIds, battlegrounds, cardTypeId, health, attack, minionTypeId, multiTypeIds } = card;
              const cleanedBattlegrounds = battlegrounds
                ? {
                    hero: battlegrounds.hero,
                    quest: battlegrounds.quest,
                    reward: battlegrounds.reward,
                    duosOnly: battlegrounds.duosOnly,
                    solosOnly: battlegrounds.solosOnly,
                    spell: cardTypeId === 42,
                    anomaly: cardTypeId === 43,
                    trinket: cardTypeId === 44,
                    timewarp: cardTypeId === 999,
                    tavernTier: battlegrounds.tier,
                  }
                : undefined;

              // get minion data
              let minion;
              if (cardTypeId === 4) {
                minion = {
                  tier: battlegrounds?.tier,
                  health: health,
                  attack: attack,
                  typeId: minionTypeId ?? MINION_TYPES.NONE,
                  multiTypeIds: multiTypeIds ?? [],
                };
              }

              // get golden text
              let upgradeText;
              if (battlegrounds?.upgradeId && localeIndex === 0) {
                try {
                  const upgradeResponse = await fetch(
                    `https://eu.api.blizzard.com/hearthstone/cards?locale=fr_FR&gameMode=battlegrounds&id=${battlegrounds.upgradeId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  if (upgradeResponse.ok) {
                    const upgradeData = await upgradeResponse.json();
                    const upgradeCard = upgradeData.cards?.[0];
                    if (upgradeCard && upgradeCard.text) {
                      upgradeText = cleanText(upgradeCard.text);
                    }
                  }
                } catch (upgradeError) {
                  console.error("Failed to fetch upgrade card data:", upgradeError);
                }
              }

              // get hero power text
              if (battlegrounds?.hero && Array.isArray(childIds) && localeIndex === 0) {
                for (const childId of childIds) {
                  try {
                    const childResponse = await fetch(
                      `https://eu.api.blizzard.com/hearthstone/cards?locale=fr_FR&gameMode=battlegrounds&id=${childId}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      },
                    );

                    if (childResponse.ok) {
                      const childData = await childResponse.json();
                      const childCard = childData.cards?.[0];
                      if (childCard && childCard.cardTypeId === 10 && childCard.text) {
                        text = cleanText(childCard.text);
                        break; // Update the text and stop searching
                      }
                    }
                  } catch (childError) {
                    console.error("Failed to fetch child card data:", childError);
                  }
                }
              }

              // get companion data
              let companion;
              if (battlegrounds?.companionId) {
                try {
                  const companionResponse = await fetch(
                    `https://eu.api.blizzard.com/hearthstone/cards?locale=fr_FR&gameMode=battlegrounds&id=${battlegrounds.companionId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  if (companionResponse.ok) {
                    const companionData = await companionResponse.json();
                    const companionCard = companionData.cards?.[0];
                    if (companionCard && companionCard.name && companionCard.text) {
                      companion = {
                        name: companionCard.name,
                        text: cleanText(companionCard.text),
                        tier: companionCard.battlegrounds.tier,
                        health: companionCard.health,
                        attack: companionCard.attack,
                        typeId: companionCard.minionTypeId ?? MINION_TYPES.NONE,
                        multiTypeIds: companionCard.multiTypeIds ?? [],
                      };
                    }
                  }
                } catch (companionError) {
                  console.error("Failed to fetch companion card data:", companionError);
                }
              }

              return {
                slug,
                name: {
                  [localeIndex === 0 ? "fr" : "en"]: name,
                },
                text: localeIndex === 0 ? cleanText(text) : undefined, // Keep only French text
                upgradeText,
                companion,
                minion,
                cardTypeId,
                battlegrounds: cleanedBattlegrounds,
              };
            }),
          );
        }),
      );

      // Combine results from both locales
      allCards = allCards.concat(localeResults.flat());

      // Increment pages for locales
      currentPages = currentPages.map((page, index) => (page < data[index].pageCount ? page + 1 : page));

      // Break the loop if all pages for both locales are fetched
      if (currentPages.every((page, index) => page >= data[index].pageCount)) {
        break;
      }
    }

    // Merge card data by slug
    const mergedCards = allCards.reduce((acc, card) => {
      if (!acc[card.slug]) {
        acc[card.slug] = { ...card };
      } else {
        acc[card.slug] = {
          ...acc[card.slug],
          name: { ...acc[card.slug].name, ...card.name },
          text: acc[card.slug].text || card.text, // Keep French text
          upgradeText: acc[card.slug].upgradeText || card.upgradeText, // Keep French text
          minion: acc[card.slug].minion || card.minion,
          companion: acc[card.slug].companion || card.companion,
        };
      }
      return acc;
    }, {});

    return Object.values(mergedCards);
  } catch (error) {
    console.error("fetchCards:", error);
    return [];
  }
};
