import fetch from "node-fetch";
import { MemoryCache } from "./utils/memory-cache.js";

const VALID_REGIONS = ["EU", "US", "AP"];

const cache = new MemoryCache();

const findRankByAccountId = (allPlayers, accountId) => {
  // Find the player object that matches the accountId
  const player = allPlayers.find(
    (player) => player.accountid.toLowerCase() === accountId.toLowerCase()
  );

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
const fetchLeaderboardData = async (args) => {
  const paramOne = args[0];
  let paramTwo = args[1];

  const cacheKey = [paramOne, paramTwo];
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

  const leaderboardId = "battlegrounds";
  let allPlayers = [];
  let MAX_PAGES = 1; // Default value before the first API call

  try {
    // Fetch the first page to determine the total number of pages
    const firstPageUrl = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardId}&page=1`;
    const firstPageData = await fetchData(firstPageUrl);

    // Update MAX_PAGES based on the totalPages in the API response
    if (
      firstPageData &&
      firstPageData.leaderboard &&
      firstPageData.leaderboard.pagination
    ) {
      MAX_PAGES = firstPageData.leaderboard.pagination.totalPages;
    }

    // Add the first page of players to the list
    if (firstPageData.leaderboard && firstPageData.leaderboard.rows) {
      allPlayers = allPlayers.concat(firstPageData.leaderboard.rows);
    }

    // Generate promises for remaining pages, if any
    const promises = [];
    for (let page = 2; page <= MAX_PAGES; page++) {
      const url = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardId}&page=${page}`;
      promises.push(fetchData(url));
    }

    // Execute all remaining promises simultaneously and process results
    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result && result.leaderboard && result.leaderboard.rows) {
        allPlayers = allPlayers.concat(result.leaderboard.rows);
      }
    });

    // Attempt to parse paramOne as a number
    const parsedNumber = Number(paramOne);

    if (!isNaN(parsedNumber)) {
      // paramOne is a number (index), return the player at that index
      const index = parsedNumber - 1; // Adjust for 1-based indexing
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
      console.error(
        "Invalid paramOne type. Must be a string (account ID) or a number (index)."
      );
      return null;
    }
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
  }
};

export { fetchLeaderboardData };
