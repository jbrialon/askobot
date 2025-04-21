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

// Store
import { useStore } from "./store/store.js";

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
              manager.trigger("ask-askobot", {
                username,
                message,
              });
            },
            {
              disabled: !isDev,
            },
          ),
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
      <Leva collapsed={true} />
      <Experience />
      <div className="ui">
        <Start />
        {showConsole && <Console />}
        <Chat />
      </div>
    </>
  );
}

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
