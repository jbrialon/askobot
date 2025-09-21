import fetch from "node-fetch";

let cachedToken = null;
let tokenExpiry = 0;

const getValidToken = async () => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  if (cachedToken && now < tokenExpiry) {
    return cachedToken; // Return cached token if it's still valid
  }

  const { token, expiresIn } = await getOAuthToken();
  cachedToken = token;
  tokenExpiry = now + expiresIn - 60; // Refresh 1 minute before actual expiration
  return cachedToken;
};

const getOAuthToken = async () => {
  const tokenUrl = "https://oauth.battle.net/token";
  const authString = Buffer.from(`${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Return the token and expiration time
    return {
      token: data.access_token,
      expiresIn: data.expires_in, // Validity period in seconds
    };
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    throw error;
  }
};

// Function to add French ordinal suffixes
const getFrenchOrdinal = (rank) => {
  if (rank === 1) return `${rank}er`; // "1er" for 1st place
  return `${rank}ème`; // "2ème", "3ème", etc. for other ranks
};

const cleanText = (text) => {
  return text.replace(/<\/?(b|i)>/g, ""); // Removes <b>, </b>, <i>, and </i> tags};
};

export { getValidToken, getFrenchOrdinal, cleanText };
