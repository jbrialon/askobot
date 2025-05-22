import styles from "./oauth.module.scss";
import { useLocation } from "react-router";
import { nonce } from "./oauth-utils";

export const Oauth = () => {
  const { pathname } = useLocation();

  const handleOauth = () => {
    const state = nonce(32);
    // save the unique state to verify integrity of the request/reply pair later
    window.sessionStorage.setItem("oauth-state", JSON.stringify({ path: pathname, state }));

    const params = new URLSearchParams({
      redirect_uri: `${TWITCH_OAUTH_REDIRECT_URL}/oauth-callback`,
      client_id: APP_CLIENT_ID,
      response_type: "code",
      scope: "moderator:read:followers channel:read:subscriptions",
      state,
    });
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  return (
    <div className={styles["page-oauth"]}>
      <button onClick={handleOauth} className={styles["oauth-button"]}>
        connect
      </button>
    </div>
  );
};
