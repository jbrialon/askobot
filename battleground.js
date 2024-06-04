import fetch from "node-fetch";

const VALID_REGIONS = ["EU", "US", "AP"];
const MAX_PAGES = 4;

const findRankByAccountId = (allPlayers, accountId) => {
  // Find the player object that matches the accountId
  const player = allPlayers.find(
    (player) => player.accountid.toLowerCase() === accountId.toLowerCase()
  );

  // If a player is found, return their rank, otherwise return null
  return player ? player.rank : null;
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
  const region = "EU";
  const leaderboardId = "battlegrounds";
  let allPlayers = [];

  // Generate promises for each page
  const promises = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=${leaderboardId}&page=${page}`;
    promises.push(fetchData(url));
  }

  // Execute all promises simultaneously and process results
  try {
    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result && result.leaderboard && result.leaderboard.rows) {
        allPlayers = allPlayers.concat(result.leaderboard.rows);
      }
    });

    // Process or return the combined results
    return findRankByAccountId(allPlayers, args[0]);
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
  }
};

export { fetchLeaderboardData };
