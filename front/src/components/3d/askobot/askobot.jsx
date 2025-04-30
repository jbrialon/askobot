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
  }, [barNumber, barColor, equalizerMaterial]);

  useEffect(() => {
    if (led && ledMaterial) {
      led.material = ledMaterial;
      led.material.color.set(new Color(ledColor));
    }
  }, [ledMaterial, ledColor, led]);

  useEffect(() => {
    lensMesh.forEach((mesh) => (mesh.material = lensMaterial));
    equilizer.material = equalizerMaterial;
    led.material = ledMaterial;
  }, [lensMesh, equilizer, lensMaterial, equalizerMaterial, ledMaterial]);

  return (
    <>
      <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
        <group ref={groupRef}>
          <primitive ref={askobotRef} object={model} />
          <Spline
            curvePoints={looping.curvePoints}
            curve={looping.curve}
            showSpline={false}
          ></Spline>
        </group>
      </Float>
      <Spline
        curvePoints={intro.curvePoints}
        curve={intro.curve}
        showSpline={false}
      ></Spline>
    </>
  );
}

useGLTF.preload("/askobot_compressed.glb");
