import "./styles/oauth.scss";
import { useLocation } from "react-router";

const nonce = (length) => {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz+/";
  let result = "";

  while (length > 0) {
    const bytes = new Uint8Array(16);
    const random = window.crypto.getRandomValues(bytes);

    random.forEach(function (c) {
      if (length == 0) {
        return;
      }
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
};

export const Oauth = () => {
  const { pathname } = useLocation();

  const handleOauth = () => {
    const state = nonce(32);
    window.sessionStorage.setItem(
      "oauth-state",
      JSON.stringify({ path: pathname, state }),
    );

    const params = new URLSearchParams({
      redirect_uri: TWITCH_OAUTH_REDIRECT_URL,
      client_id: APP_CLIENT_ID,
      response_type: "code",
      scope: "moderator:read:followers channel:read:subscriptions",
      state,
    });
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  return (
    <div className="oauth-container">
      <button onClick={handleOauth} className="oauth-button">
        Allow
      </button>
    </div>
  );
};
