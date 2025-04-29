import { gsap } from "gsap";
import { Color } from "three";

// React
import { useEffect, useRef, useMemo, useState } from "react";
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

// Curves
import { looping, intro } from "../spline/curves";

// Components
import Spline from "../spline/spline";

export default function Askobot() {
  const manager = useMemo(() => new Manager(), []);
  const scene = useStore((state) => state.scene);
  const groupRef = useRef();
  const askobotRef = useRef();

  // Model
  const { model, batteries, lens, lensMesh, wings, antennas, led, equilizer } =
    useAskobotModel();
  // Animations
  const animations = useAskobotAnimation(askobotRef, groupRef, scene, {
    wings,
    antennas,
    lens,
    batteries,
    led,
  });
  // Leva Controls
  const { barNumber, barColor, ledColor } = useAskobotControls(animations);
  // Materials
  const { lensMaterial, equalizerMaterial, ledMaterial } = useAskobotMaterials(
    barNumber,
    barColor,
    ledColor,
  );

  // Audio
  useAskobotAudio(manager, scene, animations, askobotRef, equalizerMaterial);

  // Hooks
  useEffect(() => {
    equalizerMaterial.uniforms.uBarNumber.value = barNumber;
    equalizerMaterial.uniforms.uBarColor.value.set(barColor);
    led.material.color.set(new Color(ledColor));
  }, [barNumber, barColor, equalizerMaterial, ledColor]);

  useEffect(() => {
    lensMesh.forEach((mesh) => (mesh.material = lensMaterial));
    equilizer.material = equalizerMaterial;
    led.material = ledMaterial;
  }, [lensMesh, equilizer, lensMaterial, equalizerMaterial, ledMaterial]);

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
    <>
      <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
        <group ref={groupRef}>
          <primitive ref={askobotRef} object={model} />
          <Spline
            curvePoints={looping.curvePoints}
            curve={looping.curve}
            showSpline={true}
          ></Spline>
        </group>
      </Float>
      <Spline
        curvePoints={intro.curvePoints}
        curve={intro.curve}
        showSpline={true}
      ></Spline>
    </>
  );
}

useGLTF.preload("/askobot_compressed.glb");
