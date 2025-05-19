import { NextFunction, Request, Response } from "express";
import { oAuthTokensPersistentStorage } from "../database/twitch-tokens.js";
import { getUserOauthTokens } from "./auth-clients.js";
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
    const { code } = JSON.parse(req.body);

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
    console.log(token);
    // do we have to do something here?
    // const tokenData = await validateUserOauthToken({
    //   access_token: token.access_token,
    // });
    // if (!tokenData) {
    //   console.error("Unable to validate user oauth token with Twitch API");
    //   return;
    // }

    // console.log(`Saving token for user_id ${token.user_id} in db`);
    // await oAuthTokensPersistentStorage.setTokens(token.user_id, token);
  } catch (err) {
    console.error(err);
  }
  res.end();
}
