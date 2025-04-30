import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, Bone } from "three";

export default function useAskobotModel(
  url = "/models/askobot_compressed.glb",
) {
  const { scene: model } = useGLTF(url);

  const { batteries, lens, lensMesh, wings, antennas, led, equilizer } =
    useMemo(() => {
      const batteries = [];
      const lens = [];
      const wings = [];
      const antennas = [];
      const lensMesh = [];
      let led = null;
      let equilizer = null;
      model.traverse((child) => {
        if (child instanceof Mesh) {
          if (child.name.includes("Lens00")) {
            lensMesh.push(child);
          } else if (child.name.includes("Equilizer")) {
            child.position.y = child.position.y + 0.001;
            child.position.z = child.position.z + 0.001;
            child.scale.set(1, 0.95, 1);
            equilizer = child;
          } else if (child.material.name === "Lens") {
            lensMesh.push(child);
          } else if (child.name === "Cube019_1") {
            led = child;
          } else if (child.name.includes("Battery")) {
            batteries.push(child);
          } else if (child.name === "Lens_Baked") {
            // lensMesh.push(child);
          } else if (child.name === "Text003_Baked") {
            // lensMesh.push(child);
          }
        }
        if (child instanceof Bone) {
          // Wings
          if (child.name === "Bone011") {
            wings.push(child);
          } else if (child.name === "Bone012") {
            wings.push(child);
          }
          // Antennas
          if (child.name === "Bone005") {
            antennas.push(child);
          } else if (child.name === "Bone006") {
            antennas.push(child);
          }
          // Lens
          if (child.name === "Bone009") {
            lens.push(child);
          } else if (child.name === "Bone010") {
            // Glass
            lens.push(child);
          }
        }
      });

      return { batteries, lens, lensMesh, wings, antennas, led, equilizer };
    }, [model]);

  return { model, batteries, lens, lensMesh, wings, antennas, led, equilizer };
}

useGLTF.preload("/models/askobot_compressed.glb");
