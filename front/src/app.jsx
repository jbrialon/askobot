import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls } from "leva";
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

  useControls("App", {
    showConsole: {
      value: false,
      onChange: (v) => setShowConsole(v),
    },
  });

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
