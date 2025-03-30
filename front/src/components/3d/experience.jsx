import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useControls, button } from "leva";
import Manager from "../../classes/manager";

// Components
import Camera from "./camera";
import Environment from "./environment";
import Askobot from "./askobot";

export default function Experience() {
  const manager = new Manager();
  const [isOBS, setIsOBS] = useState(false);

  useControls("App", () => ({
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
  }));

  const gridSize = [200, 100];
  const gridConfig = {
    cellSize: 0.5,
    cellThickness: 1,
    cellColor: "#ffffff",
    sectionSize: 2,
    sectionThickness: 2.0,
    sectionColor: "#f0f0f0",
    fadeDistance: 20,
    fadeStrength: 1,
    followCamera: false,
    infiniteGrid: true,
  };

  useEffect(() => {
    const { isOBS } = manager.getState();
    setIsOBS(isOBS);
  }, []);

  return (
    <>
      <Canvas>
        <Camera />
        <Environment />
        <Suspense>
          <Askobot />
        </Suspense>
        {!isOBS && <Grid args={gridSize} {...gridConfig} />}
      </Canvas>
    </>
  );
}
