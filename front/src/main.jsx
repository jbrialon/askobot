import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.scss";

// Classes
import Socket from "./classes/socket.js";

// Components
import Experience from "./components/3d/experience.jsx";
import Chat from "./components/ui/chat/chat.jsx";

function App() {
  const socket = new Socket().instance;

  return (
    <>
      <Experience socket={socket} />
      <Chat socket={socket}></Chat>
    </>
  );
}

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
