import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, Bone } from "three";

export default function useAskobotModel(
  url = "/models/askobot_compressed.glb",
) {
  const { scene: model } = useGLTF(url);

  const { batteries, lens, lensMesh, wings, antennas, equilizer } =
    useMemo(() => {
      const batteries = [];
      const lens = [];
      const wings = [];
      const antennas = [];
      const lensMesh = [];

      let equilizer = null;
      model.traverse((child) => {
        if (child instanceof Mesh) {
          if (child.name.includes("Lens00")) {
            lensMesh.push(child);
          } else if (child.name.includes("Equilizer")) {
            equilizer = child;
          } else if (child.material.name === "Lens") {
            lensMesh.push(child);
          } else if (child.name === "LED001") {
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

      return { batteries, lens, lensMesh, wings, antennas, equilizer };
    }, [model]);

  return { model, batteries, lens, lensMesh, wings, antennas, equilizer };
}

useGLTF.preload("/models/askobot_compressed.glb");
