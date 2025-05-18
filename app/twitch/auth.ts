import "dotenv/config";
import {
  AppTokenAuthProvider,
  StaticAuthProvider,
  RefreshingAuthProvider,
} from "@twurple/auth";

const clientId = process.env["TWITCH_CLIENT_ID"];
const clientSecret = process.env["TWITCH_CLIENT_SECRET"];
const accessToken = process.env["TWITCH_OAUTH"];

if (!clientId || !clientSecret || !accessToken) {
  throw new Error(
    "TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET and TWITCH_ACCESS_TOKEN must be set",
  );
}

export const authProvider = new AppTokenAuthProvider(clientId, clientSecret);

export const staticAuthProvider = new StaticAuthProvider(
  clientId,
  accessToken,
  ["chat:read", "chat:edit", "channel:moderate"],
);

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
