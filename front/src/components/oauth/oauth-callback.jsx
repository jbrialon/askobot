import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import styles from "./oauth.module.scss";

export const OauthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading", "success", "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOauthCallback = async () => {
      try {
        const sessionStorageState = window.sessionStorage.getItem("oauth-state");
        if (sessionStorageState === null) {
          console.error("Unable to get session storage state");
          setStatus("error");
          setMessage("OAuth introuvable. Veuillez réessayer.");
          return;
        }

        const { state, path } = JSON.parse(sessionStorageState);
        const urlState = new URLSearchParams(window.location.search).get("state");

        if (state !== urlState) {
          console.error("State in session storage does not match state in URL, this smells fishy!");
          setStatus("error");
          setMessage("Erreur de sécurité OAuth détectée.");
          return;
        }

        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
          setStatus("error");
          setMessage("Aucun code d'autorisation reçu de Twitch.");
          return;
        }

        const response = await fetch(`${APP_URL}/oauth-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
          mode: "cors",
        });

        if (response.ok) {
          setStatus("success");
          setMessage("Authentification Twitch réussie !");
        } else {
          setStatus("error");
          setMessage("Échec de l'authentification Twitch. Veuillez réessayer.");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage("Une erreur s'est produite lors de l'authentification.");
      }
    };

    handleOauthCallback();
  }, [navigate]);

  return (
    <div className={styles["oauth"]}>
      <div
        className={`${styles["oauth__box"]} ${status === "success" ? styles["oauth__box--success"] : ""} ${status === "error" ? styles["oauth__box--error"] : ""}`}
      >
        {status === "loading" && <div>Authentification avec Twitch...</div>}
        {status === "success" && <div>{message}</div>}
        {status === "error" && <div>{message}</div>}
      </div>
    </div>
  );
};
