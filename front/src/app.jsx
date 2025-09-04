import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls, button } from "leva";
import "@/styles/style.scss";

// Components
import Experience from "@/components/3d/experience.jsx";
import Chat from "@/components/ui/chat/chat.jsx";
import Console from "@/components/ui/console/console.jsx";
import Start from "@/components/ui/start/start.jsx";
import { Oauth } from "@/components/oauth/oauth.jsx";
import { OauthCallback } from "@/components/oauth/oauth-callback.jsx";

// Store
import { useStore } from "@/store/store.js";

// Router
import { createBrowserRouter, RouterProvider, useParams } from "react-router";

function App() {
  const { channel } = useParams();
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    useStore.getState().setChannel(channel);
  }, [channel]);

  // Debug
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
    path: "/:channel",
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
    <Leva collapsed={true} hidden={true} />
    <Experience />
    <RouterProvider router={router} />,
  </StrictMode>,
);
