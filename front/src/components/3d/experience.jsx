import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useControls, button } from "leva";

// Components
import Camera from "./camera";
import Environment from "./environment";
import Askobot from "./askobot";

export default function Experience({ socket, isOBS }) {
  useControls(() => ({
    nickname: "Jérémy",
    question: "yo askobot, la forme?",
    Ask: button((get) => {
      const currentNickname = get("nickname");
      const currentQuestion = get("question");
      socket.emit("ask-gpt", currentNickname, currentQuestion);
    }),
  }));

  const gridSize = [200, 100];
  const gridConfig = {
    cellSize: 0.5,
    cellThickness: 0.5,
    cellColor: "#ffffff",
    sectionSize: 2,
    sectionThickness: 1.3,
    sectionColor: "#f0f0f0",
    fadeDistance: 20,
    fadeStrength: 1,
    followCamera: false,
    infiniteGrid: true,
  };

  return (
    <Canvas>
      <Camera />
      <Environment />
      <Suspense>
        <Askobot socket={socket} />
      </Suspense>
      {!isOBS && <Grid args={gridSize} {...gridConfig} />}
    </Canvas>
  );
}
