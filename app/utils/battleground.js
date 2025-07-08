import fetch from "node-fetch";
import Fuse from "fuse.js";

import { MemoryCache } from "../classes/memory-cache.js";
import { getValidToken, cleanText } from "./utils.js";
import cards from "../../db/db.json" with { type: "json" };

const VALID_REGIONS = ["EU", "US", "AP"];
const PLAYERS_PER_PAGE = 25;
const TOP_PAGES = 8;
const CURRENT_BG_SEASON = 15;
const CURRENT_ARENA_SEASON = 2;
const cache = new MemoryCache();

export const CARD_TYPES = {
  HERO: 3,
  MINION: 4,
  HERO_POWER: 10,
  SPELL: 42,
  ANOMALY: 43,
  TRINKET: 44,
  COMPANION: 45,
};

export const CLASS_TYPES = {
  NEUTRAL: 0,
  WARRIOR: 1,
  PALADIN: 2,
  HUNTER: 3,
  ROGUE: 4,
  PRIEST: 5,
  DEATH_KNIGHT: 6,
  SHAMAN: 7,
  MAGE: 8,
  WARLOCK: 9,
  DRUID: 10,
  DEMON_HUNTER: 14,
};

export const LEADERBOARD_TYPES = {
  BATTLEGROUNDS: "battlegrounds",
  BATTLEGROUNDS_DUO: "battlegroundsduo",
  ARENA: "undergroundarena",
};

const findRankByAccountId = (allPlayers, accountId) => {
  // Find the player object that matches the accountId
  const player = allPlayers.find((player) => player.accountid.toLowerCase() === accountId.toLowerCase());

  // If a player is found, return the player object, otherwise return null
  return player ? player : null;
};

// Function to fetch data using node-fetch and return a Promise
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

// Main function to fetch leaderboard data for the first 100 players
const fetchLeaderboardData = async (args, leaderboardType = LEADERBOARD_TYPES.BATTLEGROUNDS) => {
  const paramOne = args[0];
  let paramTwo = args[1];

  const cacheKey = [paramOne, paramTwo, leaderboardType];
  // Alias mode (Cheat Mode) when we search for "Sheupluh" we display the results for "oliech"
  const overrideName = paramOne === "Sheupluh" ? "oliech" : paramOne;
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
  const playerRankNumber = Number(overrideName);

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
        if (paramOne === "Sheupluh" && player) {
          player.accountid = "Sheupluh";
        }
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
      const leaderboardData = findRankByAccountId(players, overrideName);
      if (leaderboardData) {
        if (paramOne === "Sheupluh" && leaderboardData) {
          leaderboardData.accountid = "Sheupluh";
        }
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
        if (paramOne === "Sheupluh" && player) {
          player.accountid = "Sheupluh";
        }
        cache.set(cacheKey, player);
      }
      return player;
    } else if (typeof overrideName === "string") {
      // paramOne is an account ID (string), find the rank by account ID
      const leaderboardData = findRankByAccountId(allPlayers, overrideName);
      if (leaderboardData) {
        if (paramOne === "Sheupluh" && leaderboardData) {
          leaderboardData.accountid = "Sheupluh";
        }
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

const fetchCardData = (cardName, type) => {
  const options = {
    keys: ["name.en", "name.fr"], // Fields to search
    threshold: 0.3, // Lower threshold means stricter matches
    includeScore: true, // Include match score for sorting
  };

  // Filter cards based on type
  let dataset;
  switch (type) {
    case CARD_TYPES.HERO:
      dataset = cards.filter((card) => card.battlegrounds?.hero === true && !card.battlegrounds?.quest && !card.battlegrounds?.reward);
      break;
    case CARD_TYPES.TRINKET:
      dataset = cards.filter((card) => card.battlegrounds?.trinket === true);
      break;
    case CARD_TYPES.ANOMALY:
      dataset = cards.filter((card) => card.battlegrounds?.anomaly === true);
      break;
    case CARD_TYPES.SPELL:
      dataset = cards.filter((card) => card.battlegrounds?.spell === true);
      break;
    default: // Normal tavern card
      dataset = cards.filter(
        (card) =>
          !card.battlegrounds?.hero &&
          !card.battlegrounds?.quest &&
          !card.battlegrounds?.reward &&
          !card.battlegrounds?.trinket &&
          !card.battlegrounds?.anomaly &&
          !card.battlegrounds?.spell,
      );
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

const fetchAllCardData = async () => {
  // Battlegrounds Card Type:
  // 3  - Hero
  // 4  - Minion
  // 10 - Hero Power
  // 42 - Spell
  // 43 - Anomaly
  // 44 - Trinket
  // 45 - Companion

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
            localeCards.map(async ({ slug, name, text, childIds, battlegrounds, cardTypeId }) => {
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
                    tavernTier: battlegrounds.tier,
                  }
                : undefined;

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

export { fetchAllCardData, fetchCardData, fetchLeaderboardData };
