import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import Manager from "../../classes/manager";
import { gsap } from "gsap";

// Components
import Camera from "./camera";
import Environment from "./environment";
import Askobot from "./askobot";
import Start from "./start";

export default function Experience() {
  const manager = new Manager();
  const [activeScene, setActiveScene] = useState("live");

  const appElement = document.getElementById("app");
  const gridRef = useRef();

  const gridSize = [200, 100];
  const gridConfig = {
    cellSize: 0.5,
    cellThickness: 1,
    cellColor: "#ffffff",
    sectionSize: 2,
    sectionThickness: 2.0,
    sectionColor: "#6794ba",
    fadeDistance: 20,
    fadeStrength: 1,
    followCamera: false,
    infiniteGrid: true,
  };

  useEffect(() => {
    const handler = (e) => {
      setActiveScene(e.detail.name);
    };
    manager.on("obs-scene-changed", handler);
    return () => manager.off("obs-scene-changed", handler);
  }, [manager]);

  useEffect(() => {
    if (!gridRef.current) return;

    if (activeScene === "live") {
      appElement?.classList.add("live");
      gsap.to(gridRef.current.position, {
        y: -6,
        duration: 1.5,
        ease: "power1.inOut",
      });
    } else {
      appElement?.classList.remove("live");
      gsap.to(gridRef.current.position, {
        y: 0,
        duration: 1.5,
        ease: "power1.inOut",
      });
    }
  }, [activeScene]);

  return (
    <>
      <Canvas className="webgl">
        <Camera />
        <Environment />
        <Suspense>
          <Askobot />
        </Suspense>
        <Start />
        <Grid position-y={-6} ref={gridRef} args={gridSize} {...gridConfig} />
      </Canvas>
    </>
  );
}
