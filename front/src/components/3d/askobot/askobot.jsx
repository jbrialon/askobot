import { gsap } from "gsap";
import { Color, CatmullRomCurve3, Vector3 } from "three";

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

// Components
import Splines from "../splines/splines";

export default function Askobot() {
  const manager = useMemo(() => new Manager(), []);
  const scene = useStore((state) => state.scene);
  const askobotRef = useRef();

  const position = askobotRef.current?.position;

  // const curvePoints = position
  //   ? [
  //       new Vector3(position.x, position.y, position.z),
  //       new Vector3(position.x, position.y + 0.35, position.z + 0.5),
  //       new Vector3(position.x, position.y + 0.7, position.z + 1),
  //       new Vector3(position.x, position.y + 1.05, position.z + 0.5),
  //       new Vector3(position.x, position.y + 1.4, position.z),
  //       new Vector3(position.x, position.y + 1.05, position.z - 0.5),
  //       new Vector3(position.x, position.y + 0.7, position.z - 1),
  //       new Vector3(position.x, position.y + 0.35, position.z - 0.5),
  //       new Vector3(position.x, position.y, position.z),
  //     ]
  //   : [];
  const curvePoints = [];
  const radius = 0.6;

  if (position) {
    for (let i = 0; i <= 360; i++) {
      curvePoints.push(
        new Vector3(
          position.x,
          position.y + Math.sin(i * (Math.PI / 180)) * radius,
          position.z + Math.cos(i * (Math.PI / 180)) * radius,
        ),
      );
    }
  }
  const curve = new CatmullRomCurve3(curvePoints);

  // Model
  const { model, batteries, lens, lensMesh, wings, antennas, led, equilizer } =
    useAskobotModel();
  // Animations
  const animations = useAskobotAnimation(askobotRef, scene, curve, {
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
        <primitive ref={askobotRef} object={model} />
      </Float>
      <Splines curvePoints={curvePoints} curve={curve}></Splines>
    </>
  );
}

useGLTF.preload("/askobot_compressed.glb");
