import "dotenv/config";
import { StaticAuthProvider, RefreshingAuthProvider, exchangeCode } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { oAuthTokensPersistentStorage } from "../database/twitch-tokens.js";

const clientId = process.env["TWITCH_CLIENT_ID"];
const clientSecret = process.env["TWITCH_CLIENT_SECRET"];
const accessToken = process.env["TWITCH_OAUTH"];
const redirectUri = `${process.env["APP_URL"]}/oauth-callback`;

if (!clientId || !clientSecret || !accessToken || !redirectUri) {
  throw new Error("env variables TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_OAUTH, APP_URL must be set");
}

// used by the chatbot
export const staticAuthProvider = new StaticAuthProvider(clientId, accessToken, ["chat:read", "chat:edit", "channel:moderate"]);

// contains ther user's oauth tokens for higher permissions
const refreshingAuthProvider = new RefreshingAuthProvider({
  clientId,
  clientSecret,
});

export async function persistUserTokens(
  userId: string,
  { access_token, refresh_token, expires_in }: { access_token: string; refresh_token: string; expires_in: number },
) {
  try {
    await oAuthTokensPersistentStorage.setTokens(userId, {
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (err) {
    console.error(`Unable to persist tokens for ${userId}: ${err}`);
  }
}

refreshingAuthProvider.onRefresh(async (userId, token) => {
  try {
    if (!token || !token.refreshToken || !token.expiresIn) {
      console.error(`Unable to refresh token for ${userId}`);
      return;
    }
    await persistUserTokens(userId, {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expires_in: token.expiresIn,
    });
  } catch (err) {
    console.error(`Unable to refresh token for ${userId}: ${err}`);
  }
});

export async function getUserOauthTokens({ code }: { code: string }) {
  const token = await exchangeCode(clientId!, clientSecret!, code, redirectUri!);
  await refreshingAuthProvider.addUserForToken(token);
  return token;
}

export const apiClient = new ApiClient({
  authProvider: refreshingAuthProvider,
});
