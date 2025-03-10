import fetch from "node-fetch";

const cache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches Twitch channel information for the given channel name.
 *
 * @param {string} channel - The Twitch channel login name.
 * @returns {Promise<object|null>} An object containing channel info, or null if not found.
 */
async function getChannelInfo(channel) {
  const channelName = channel.startsWith("#") ? channel.slice(1) : channel;

  if (
    cache[channelName] &&
    Date.now() - cache[channelName].timestamp < CACHE_DURATION
  ) {
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
    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${channelName}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const userData = await userResponse.json();

    if (!userData.data || !userData.data.length) {
      console.log(`Channel "${channelName}" not found.`);
      return null;
    }

    const userInfo = userData.data[0];

    // Step 3: Get Channel Game & Title (Last Set Info)
    const channelResponse = await fetch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${userInfo.id}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const channelData = await channelResponse.json();
    let channelInfo = {};
    if (channelData.data && channelData.data.length > 0) {
      channelInfo = channelData.data[0];
    }

    const result = {
      displayName: userInfo.display_name,
      description: userInfo.description,
      profileImage: userInfo.profile_image_url,
      offlineBanner: userInfo.offline_image_url,
      game: channelInfo.game_name || "N/A",
      title: channelInfo.title || "N/A",
    };

    cache[channelName] = {
      timestamp: Date.now(),
      data: result,
    };

    return result;
  } catch (error) {
    console.error("Error fetching data from Twitch API:", error);
    return null;
  }
}

export { getChannelInfo };
