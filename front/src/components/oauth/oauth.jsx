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
      redirect_uri: `${APP_URL}/oauth-callback`,
      client_id: APP_CLIENT_ID,
      response_type: "code",
      scope:
        "moderator:read:followers channel:read:subscriptions channel:read:redemptions channel:manage:redemptions bits:read channel:read:hype_train",
      state,
    });
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };

  return (
    <div className={styles["oauth"]}>
      <div className={styles["oauth__box"]}>
        <h3>Permissions demandées</h3>
        <ul>
          <li>
            <strong>moderator:read:followers</strong> - Lire les informations des abonnés (nécessite les privilèges de modérateur)
          </li>
          <li>
            <strong>channel:read:subscriptions</strong> - Lire les données d'abonnement (qui s'est abonné, niveaux d'abonnement)
          </li>
          <li>
            <strong>channel:read:redemptions</strong> - Lire les récompenses de points de chaîne
          </li>
          <li>
            <strong>channel:manage:redemptions</strong> - Gérer les récompenses de points de chaîne (approuver/rejeter les demandes
            d'échange)
          </li>
          <li>
            <strong>bits:read</strong> - Lire les informations de bits/cheers
          </li>
          <li>
            <strong>channel:read:hype_train</strong> - Lire les événements hype train
          </li>
        </ul>
        <p>
          Ces autorisations permettent à Askobot de s'intégrer aux fonctionnalités interactives de Twitch - suivre les abonnés, les
          abonnements, les points de chaîne, les bits/cheers, les hype trains et les raids.
        </p>
        <button onClick={handleOauth} className={styles["oauth__button"]}>
          Connecter Askobot à mon compte Twitch
        </button>
      </div>
    </div>
  );
};
