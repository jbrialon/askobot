import type { NextFunction, Request, Response } from "express";
import { getUserOauthTokens, persistUserTokens } from "./auth-clients.ts";
import { getTokenInfo } from "@twurple/auth";
import { setupEventSubSubscriptions } from "./eventsub-setup.ts";

export async function oAuthTokenMiddleWare(req: Request, res: Response, _next: NextFunction) {
  try {
    console.log("Received oAuth code from client, now validating the code with the Twitch API");
    const { code } = req.body;
    const tokens = await getUserOauthTokens({ code });

    if (!tokens || !tokens.accessToken || !tokens.refreshToken || !tokens.expiresIn) {
      const error = "Unable to get user oauth tokens from Twitch API using oauth client code";
      console.error(error);
      res.status(400).send(error);
      return;
    }
    console.log("Sucessfully got Twitch access and refresh tokens for the user");
    const tokenInfo = await getTokenInfo(tokens.accessToken);

    if (!tokenInfo?.userId) {
      const error = "Unable to validate user oauth token with Twitch API";
      console.error(error);
      res.status(400).send(error);
      return;
    }

    console.log(`Saving token for user_id ${tokenInfo.userId} in db`);
    await persistUserTokens(tokenInfo.userId, {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    });

    // Setup EventSub subscriptions when we have a new authorized user
    try {
      await setupEventSubSubscriptions();
    } catch (error) {
      console.error("Failed to setup EventSub subscriptions after OAuth:", error);
    }
  } catch (err) {
    console.error(err);
  }
  res.end();
}
