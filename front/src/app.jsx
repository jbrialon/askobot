import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls, button } from "leva";
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

  if (import.meta.env.MODE === "development") {
    useControls("Bot", () => ({
      nickname: "Jérémy",
      question: "yo askobot, la forme?",
      Ask: button((get) => {
        const currentNickname = get("Bot.nickname");
        const currentQuestion = get("Bot.question");
        manager.trigger("ask-gpt", {
          nickname: currentNickname,
          question: currentQuestion,
        });
      }),
    }));
  }

  useControls("OBS", () => ({
    showConsole: {
      value: false,
      onChange: (value) => setShowConsole(value),
    },
    "Start Scene": button(() => {
      useStore.getState().setScene("start");
    }),
    "Live Scene": button(() => {
      useStore.getState().setScene("live");
    }),
    "End Scene": button(() => {
      useStore.getState().setScene("end");
    }),
  }));

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
