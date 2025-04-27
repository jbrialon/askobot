import { gsap } from "gsap";

// React
import { useEffect, useRef, useMemo } from "react";
import { Float, useGLTF } from "@react-three/drei";

// App
import Manager from "../../../classes/manager";
import useAskobotModel from "./useAskobotModel";
import useAskobotMaterials from "./useAskobotMaterials";
import useAskobotAnimation from "./useAskobotAnimation";
import useAskobotAudio from "./useAskobotAudio";
import useAskobotControls from "./useAskobotControls";

// Store
import { useStore } from "../../../store/store";

export default function Askobot() {
  const manager = useMemo(() => new Manager(), []);
  const scene = useStore((state) => state.scene);
  const askobotRef = useRef();

  // Moddel
  const { model, batteries, lens, lensMesh, wings, antennas, equilizer } =
    useAskobotModel();
  // Animations
  const animations = useAskobotAnimation(askobotRef, scene, {
    wings,
    antennas,
    lens,
    batteries,
  });
  // Leva Controls
  const { barNumber, barColor } = useAskobotControls(animations);
  // Materials
  const { lensMaterial, equalizerMaterial } = useAskobotMaterials(
    barNumber,
    barColor,
  );

  // Audio
  useAskobotAudio(manager, scene, animations, askobotRef, equalizerMaterial);

  // Hooks
  useEffect(() => {
    equalizerMaterial.uniforms.uBarNumber.value = barNumber;
    equalizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equalizerMaterial]);

  useEffect(() => {
    lensMesh.forEach((mesh) => (mesh.material = lensMaterial));
    equilizer.material = equalizerMaterial;
  }, [equilizer, lensMaterial, equalizerMaterial]);

  // Dance Intro animation (TODO: Enhance and move logic)
  useEffect(() => {
    let rotationTween = null;

    const handler = (e) => {
      const analysis = Math.pow(e.detail * 0.85, 8);

      if (analysis > 0.0225) {
        if (rotationTween && rotationTween.isActive()) return;

        rotationTween = gsap.to(askobotRef.current.rotation, {
          x: Math.PI * analysis,
          duration: 0.25,
          repeat: 1,
          yoyo: true,
          ease: "power1.inOut",
        });
      }
    };
    manager.on("audio-startScene", handler);

    return () => manager.off("audio-startScene", handler);
  }, [manager]);

  return (
    <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
      <primitive ref={askobotRef} object={model} />
    </Float>
  );
}

useGLTF.preload("/askobot_compressed.glb");
