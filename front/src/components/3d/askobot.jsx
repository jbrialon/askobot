import { gsap } from "gsap";
// Three
import {
  MeshPhysicalMaterial,
  ShaderMaterial,
  BackSide,
  Mesh,
  Color,
  Uniform,
} from "three";

// React
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useAnimations, useGLTF } from "@react-three/drei";
import { useControls } from "leva";

// App
import Manager from "../../classes/manager";
import vertexShader from "./../../shaders/vertex.glsl";
import fragmentShader from "./../../shaders/fragment.glsl";

import { useAudioPlayer } from "./../../composables/useAudioPlayer";

export default function Askobot() {
  const askobotRef = useRef();
  const manager = new Manager();
  const { barColor, barNumber } = useControls("Equilizer", {
    barNumber: {
      value: 10,
      step: 1,
      min: 2,
      max: 60,
    },
    barColor: "#3ddfff",
  });

  const { scene: model, animations } = useGLTF("/models/askobot_baked2.glb");
  const { actions } = useAnimations(animations, model);

  actions["Basic BotAction.001"].play();

  const { analysis, playAudio } = useAudioPlayer();

  // materials
  const lensMaterial = new MeshPhysicalMaterial({
    metalness: 0.9,
    roughness: 0.05,
    envMapIntensity: 0.9,
    clearcoat: 1,
    transparent: true,
    opacity: 0.5,
    reflectivity: 0.2,
    ior: 0.9,
    color: 0xf0f0f0,
    side: BackSide,
  });

  const equilizerMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: new Uniform(0),
          uIntensity: new Uniform(0),
          uBarNumber: new Uniform(barNumber),
          uBarColor: new Uniform(new Color(barColor)),
        },
        vertexShader,
        fragmentShader,
      }),
    [],
  );

  model.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.name.includes("Lens00")) {
        child.material = lensMaterial;
      } else if (child.name.includes("equilizer")) {
        child.material = equilizerMaterial;
      }
    }
  });

  // const onPlayCallback = () => {
  //   gsap.to(floatFactor, { value: 0.5, duration: 1 });
  //   gsap.to(rotationFactor, { value: 0.5, duration: 1 });
  // };

  // const onEndedCallback = () => {
  //   // When audio ends, reset animation values
  //   gsap.to(floatFactor, { value: 0.2, duration: 1 });
  //   gsap.to(rotationFactor, { value: 0.1, duration: 1 });
  // };

  useEffect(() => {
    equilizerMaterial.uniforms.uBarNumber.value = barNumber;
    equilizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equilizerMaterial]);

  useEffect(() => {
    const handler = (e) => {
      const { audioBuffer } = e.detail;
      playAudio(audioBuffer);
    };
    manager.on("voice-data", handler);

    return () => manager.off("voice-data", handler);
  }, []);

  useEffect(() => {
    if (!askobotRef.current) return;

    const handler = (e) => {
      const scene = e.detail.name;
      if (scene === "live") {
        gsap.to(askobotRef.current.position, {
          x: 1.5,
          y: 2.7,
          z: -1,
          duration: 1.5,
          ease: "power1.inOut",
        });
      } else {
        gsap.to(askobotRef.current.position, {
          x: 0.5,
          y: 2.8,
          z: 1,
          duration: 1.5,
          ease: "power1.inOut",
        });
        gsap.to(askobotRef.current.position, {
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    };
    manager.on("obs-scene-changed", handler);

    return () => manager.off("obs-scene-changed", handler);
  }, [manager]);

  // your existing useFrame code stays the same
  useFrame((state) => {
    // equilizerMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    equilizerMaterial.uniforms.uIntensity.value = analysis;
  });

  return (
    <>
      <Float speed={5} rotationIntensity={0.2} floatIntensity={0.2}>
        <primitive ref={askobotRef} position={[0.5, 2.8, 1]} object={model} />
      </Float>
    </>
  );
}
