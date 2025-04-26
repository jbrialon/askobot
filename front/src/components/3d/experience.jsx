import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { gsap } from "gsap";

// Components
import Camera from "./camera";
import Environment from "./environment";
import Askobot from "./askobot/askobot";
import Start from "./start";
import Splines from "./splines/splines";
// Store
import { useStore } from "../../store/store";

// config
const GRID_POSITIONS = {
  live: -6,
  default: 0,
};

export default function Experience() {
  const scene = useStore((state) => state.scene);
  const isOBS = useStore((state) => state.isOBS);

  const [gridPosition, setGridPosition] = useState(GRID_POSITIONS.default);
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
    fadeDistance: 30,
    fadeStrength: 2,
    followCamera: false,
    infiniteGrid: true,
  };

  useEffect(() => {
    const targetPosition = GRID_POSITIONS[scene] ?? GRID_POSITIONS.default;

    if (gridRef.current) {
      gsap.to(gridRef.current.position, {
        y: targetPosition,
        duration: 1.5,
        ease: "power1.inOut",
      });
    }

    setGridPosition(targetPosition);

    if (scene === "live" && isOBS) {
      appElement?.classList.add("live");
    } else {
      appElement?.classList.remove("live");
    }
  }, [scene, isOBS]);

  return (
    <>
      <Canvas className="webgl">
        <Camera />
        <Environment />
        <Suspense>
          <Askobot />
        </Suspense>
        <Splines></Splines>
        <Start />
        <Grid
          position-y={gridPosition}
          ref={gridRef}
          args={gridSize}
          {...gridConfig}
        />
      </Canvas>
    </>
  );
}
