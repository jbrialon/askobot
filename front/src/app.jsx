import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls, folder, button } from "leva";
import "./styles/style.scss";

// Classes
import Manager from "./classes/manager.js";

// Components
import Experience from "./components/3d/experience.jsx";
import Chat from "./components/ui/chat/chat.jsx";
import Console from "./components/ui/console/console.jsx";
import Start from "./components/ui/start/start.jsx";
import { Oauth } from "./components/oauth/oauth.jsx";
import { OauthCallback } from "./components/oauth/oauth-callback.jsx";

// Store
import { useStore } from "./store/store.js";

// Router
import { createBrowserRouter, RouterProvider } from "react-router";

function App() {
  const manager = new Manager();
  const [showConsole, setShowConsole] = useState(false);

  // Debug
  const isDev = import.meta.env.MODE === "development";
  useControls(
    "Bot",
    () => ({
      Ask: folder(
        {
          username: {
            value: "Askow",
            disabled: !isDev,
          },
          message: {
            value: "yo askobot, la forme?",
            disabled: !isDev,
          },
          Ask: button(
            (get) => {
              const username = get("Bot.Ask.username");
              const message = get("Bot.Ask.message");
              manager.trigger("bot-askAskobot", {
                username,
                message,
              });
            },
            {
              disabled: !isDev,
            },
          ),
          fakeEvent: button(() => {
            const data = {
              sceneName: "live",
            };
            manager.trigger("bot-reactToEvent", {
              eventType: "scene-change",
              data,
            });
          }),
        },
        {
          collapsed: true,
        },
      ),
    }),
    {
      collapsed: false,
    },
  );

  useControls(
    "OBS",
    () => ({
      "Start Scene": button(() => {
        useStore.getState().setScene("start");
      }),
      "Live Scene": button(() => {
        useStore.getState().setScene("live");
      }),
      "End Scene": button(() => {
        useStore.getState().setScene("end");
      }),
      showConsole: {
        value: false,
        onChange: (value) => setShowConsole(value),
      },
    }),
    {
      collapsed: true,
    },
  );

  return (
    <>
      <div className="ui">
        <Start />
        {showConsole && <Console />}
        <Chat />
      </div>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/oauth",
    element: <Oauth />,
  },
  {
    path: "/oauth-callback",
    element: <OauthCallback />,
  },
]);

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <Leva collapsed={true} />
    <Experience />
    <RouterProvider router={router} />,
  </StrictMode>,
);
