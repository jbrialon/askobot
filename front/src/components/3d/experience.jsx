import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useControls, button } from "leva";
import Manager from "../../classes/manager";
import { gsap } from "gsap";

// Components
import Camera from "./camera";
import Environment from "./environment";
import Askobot from "./askobot";

export default function Experience() {
  const manager = new Manager();
  const [isOBS, setIsOBS] = useState(false);
  const [showDecor, setShowDecor] = useState(false);

  const appElement = document.getElementById("app");
  const gridRef = useRef();

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

  // onMounted
  useEffect(() => {
    const { isOBS } = manager.getState();
    setIsOBS(isOBS);

    manager.on("obs-scene-changed", (e) => {
      const scene = e.detail.name;

      if (scene === "live") {
        setShowDecor(false);
        appElement?.classList.add("obs");
        // TODO : Sam répare ça stp
        gsap.to(gridRef.current.position, {
          y: -5,
          duration: 1.5,
          ease: "power1.inOut",
        });
      } else {
        setShowDecor(true);
        appElement?.classList.remove("obs");
        // TODO : Sam répare ça stp
        gsap.to(gridRef.current.position, {
          y: 0,
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    });
  }, []);

  return (
    <>
      <Canvas>
        <Camera />
        <Environment />
        <Suspense>
          <Askobot />
        </Suspense>
        {showDecor && (
          <Grid
            ref={gridRef}
            position={[0, 0, 0]}
            args={gridSize}
            {...gridConfig}
          />
        )}
      </Canvas>
    </>
  );
}
