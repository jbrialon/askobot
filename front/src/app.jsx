import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls, button } from "leva";
import "./style.scss";

// Classes
import Manager from "./classes/manager.js";

// Components
import Experience from "./components/3d/experience.jsx";
import Chat from "./components/ui/chat/chat.jsx";
import Console from "./components/ui/console/console.jsx";

function App() {
  const manager = new Manager();
  const appElement = document.getElementById("app");

  const [showConsole, setShowConsole] = useState(false);

  useControls("App", () => ({
    showConsole: {
      value: false,
      onChange: (value) => setShowConsole(value),
    },
    nickname: "Jérémy",
    question: "yo askobot, la forme?",
    Ask: button((get) => {
      const currentNickname = get("App.nickname");
      const currentQuestion = get("App.question");
      manager.trigger("ask-gpt", {
        nickname: currentNickname,
        question: currentQuestion,
      });
    }),
    "Start Scene": button(() => {
      manager.trigger("obs-scene-changed", {
        name: "start",
      });
    }),
    "Live Scene": button(() => {
      manager.trigger("obs-scene-changed", {
        name: "live",
      });
    }),
    "End Scene": button(() => {
      manager.trigger("obs-scene-changed", {
        name: "end",
      });
    }),
  }));

  useEffect(() => {
    const { isOBS } = manager.getState();
    appElement?.classList.toggle("obs", isOBS);
  }, []);

  return (
    <>
      <Leva collapsed={true} />
      <Experience />
      {showConsole && <Console />}
      <Chat />
    </>
  );
}

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
