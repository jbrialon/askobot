import { NextFunction, Request, Response } from "express";
import { oAuthTokensPersistentStorage } from "../database/twitch-tokens.js";
import { getUserOauthTokens } from "./auth-clients.js";
import { getTokenInfo } from "@twurple/auth";
// import { getUserOauthTokens, validateUserOauthToken } from "../apis/oauth-twitch";

// do something twurple side

export async function oAuthTokenMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(
    "Received oAuth code from client, now validating the code with the Twitch API",
  );

  try {
    const { code } = req.body;

    const token = await getUserOauthTokens({ code });
    if (!token) {
      console.error(
        "Unable to get user oauth tokens from Twitch API using oauth client code",
      );
      return;
    }
    console.log(
      "Sucessfully got Twitch access and refresh tokens for the user",
    );
    // do we have to do something here?
    const tokenInfo = await getTokenInfo(token.accessToken);

    if (
      !tokenInfo ||
      !tokenInfo.userId ||
      !token.refreshToken ||
      !token.expiresIn
    ) {
      console.error("Unable to validate user oauth token with Twitch API");
      return;
    }

    console.log(`Saving token for user_id ${tokenInfo.userId} in db`);
    await oAuthTokensPersistentStorage.setTokens(tokenInfo.userId, {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expires_in: token.expiresIn,
    });
  } catch (err) {
    console.error(err);
  }
  res.end();
}
