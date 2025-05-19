import "dotenv/config";
import {
  AppTokenAuthProvider,
  StaticAuthProvider,
  RefreshingAuthProvider,
  exchangeCode,
} from "@twurple/auth";
import { ApiClient } from "@twurple/api";

const clientId = process.env["TWITCH_CLIENT_ID"];
const clientSecret = process.env["TWITCH_CLIENT_SECRET"];
const accessToken = process.env["TWITCH_OAUTH"];
const redirectUri = process.env["TWITCH_OAUTH_REDIRECT_URL"];

if (!clientId || !clientSecret || !accessToken || !redirectUri) {
  throw new Error(
    "TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_ACCESS_TOKEN, TWITCH_OAUTH_REDIRECT_URL must be set",
  );
}

// used by the chatbot
export const staticAuthProvider = new StaticAuthProvider(
  clientId,
  accessToken,
  ["chat:read", "chat:edit", "channel:moderate"],
);

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
export const baseClient = new ApiClient({ authProvider });

export async function getUserOauthTokens({ code }: { code: string }) {
  const token = await exchangeCode(
    clientId!,
    clientSecret!,
    code,
    redirectUri!,
  );
  return token;
}

export const refreshingAuthProvider = new RefreshingAuthProvider({
  clientId,
  clientSecret,
});

// refreshingAuthProvider.onRefresh(async (userId, token) => {
//   console.log("Refreshing token");
//   console.log(userId);
//   console.log(token);
// });

// await refreshingAuthProvider.addUserForToken(accessToken);
