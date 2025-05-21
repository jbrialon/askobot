import { useNavigate } from "react-router";
import { useEffect } from "react";

export const OauthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // TODO @Askow: what do you want to do with oauth flows in general client side?
    // We need to validate oauth tokens to enable priviledged features: what flow do you prefer?
    // 1. Does the user always need to be oauth client side?
    // 2. If not - What happens when oauth flow fails?
    // 3. Where do we redirect after successful oauth?
    const handleOauthCallback = async () => {
      const sessionStorageState = window.sessionStorage.getItem("oauth-state");
      if (sessionStorageState === null) {
        console.error("Unable to get session storage state");
        navigate("/oauth");
        return;
      }
      const { state, path } = JSON.parse(sessionStorageState);
      const urlState = new URLSearchParams(window.location.search).get("state");

      if (state !== urlState) {
        console.error("State in session storage does not match state in URL, this smells fishy!");
        navigate("/oauth");
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      console.log(code, `${TWITCH_OAUTH_REDIRECT_URL}/oauth-token`);
      await fetch(`${TWITCH_OAUTH_REDIRECT_URL}/oauth-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
        mode: "cors",
      });

      // does no matter what happens here, we retry loading the user scene
      // this.$router.push(path);
      // navigate("/");
    };

    handleOauthCallback();
  }, [navigate]);

  return null;
};
