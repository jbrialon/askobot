import fetch from "node-fetch";

const cache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

/**
 * Fetches Twitch channel information for the given channel name.
 *
 * @param {string} channel - The Twitch channel login name.
 * @returns {Promise<object|null>} An object containing channel info, or null if not found.
 */
async function getChannelInfo(channel) {
  const startTime = Date.now();
  const channelName = channel.startsWith("#") ? channel.slice(1) : channel;

  if (cache[channelName] && Date.now() - cache[channelName].timestamp < CACHE_DURATION) {
    console.log(`[getChannelInfo] Cache hit for "${channelName}" - ${Date.now() - startTime}ms`);
    return cache[channelName].data;
  }

  try {
    // Step 1: Get OAuth Token
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get User Info
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userData = await userResponse.json();

    if (!userData.data || !userData.data.length) {
      console.log(`Channel "${channelName}" not found.`);
      return null;
    }

    const userInfo = userData.data[0];

    // Step 3: Get Channel Game & Title (Last Set Info)
    const channelResponse = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${userInfo.id}`, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const channelData = await channelResponse.json();
    let channelInfo = {};
    if (channelData.data && channelData.data.length > 0) {
      channelInfo = channelData.data[0];
    }

    const NON_GAME_CATEGORIES = [
      "1469308723", // Software and Game Development
      "509658", // Just Chatting
      "509660", // Art
      "509659", // Music & Performing Arts
      "509670", // Science & Technology
      "509673", // Fitness & Health
      "509672", // Politics
      "509674", // Food & Drink
      "509669", // Special Events
      "509667", // Talk Shows & Podcasts
      "509671", // Travel & Outdoors
      "743", // Chess
    ];

    let gameName = channelInfo.game_name || "N/A";
    const gameId = channelInfo.game_id || "N/A";
    const isGame = gameId !== "N/A" && !NON_GAME_CATEGORIES.includes(gameId);

    // Update game name for Hearthstone to specifically indicate Battlegrounds
    if (gameId === "138585") {
      gameName = "Hearthstone Battlegrounds";
    }

    // Update game name for Software and Game Development
    if (gameId === "1469308723") {
      gameName = "Développement Créatif";
    }

    const result = {
      displayName: userInfo.display_name,
      description: userInfo.description,
      profileImage: userInfo.profile_image_url,
      offlineBanner: userInfo.offline_image_url,
      game: gameName,
      game_id: gameId,
      isGame: isGame,
      title: channelInfo.title || "N/A",
    };

    cache[channelName] = {
      timestamp: Date.now(),
      data: result,
    };

    const duration = Date.now() - startTime;
    console.log(`[getChannelInfo] Fetched data for "${channelName}" - ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[getChannelInfo] Error fetching data from Twitch API (${duration}ms):`, error);
    return null;
  }
}

export { getChannelInfo };
