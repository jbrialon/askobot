import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Leva } from "leva";
import "./style.scss";

// Classes
import Socket from "./classes/socket.js";

// Components
import Experience from "./components/3d/experience.jsx";
import Chat from "./components/ui/chat/chat.jsx";
import Console from "./components/ui/console/console.jsx";

function App() {
  const socket = new Socket().instance;
  const appElement = document.getElementById("app");
  const [isOBS, setIsOBS] = useState(false);

  useEffect(() => {
    if (typeof window.obsstudio !== "undefined") {
      setIsOBS(true);
      appElement?.classList.add("obs");
    } else {
      setIsOBS(false);
      appElement?.classList.remove("obs");
    }
  }, []);

  return (
    <>
      <Leva hidden={isOBS} collapsed={true} />
      <Experience socket={socket} isOBS={isOBS} />
      <Console isOBS={isOBS} />
      <Chat socket={socket} />
    </>
  );
}

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
