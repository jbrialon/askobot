import {
  MeshPhysicalMaterial,
  ShaderMaterial,
  BackSide,
  Mesh,
  Color,
  Uniform,
} from "three";
import { useEffect } from "react";

import { useFrame } from "@react-three/fiber";
import { Float, useAnimations, useGLTF } from "@react-three/drei";

import vertexShader from "./../../shaders/vertex.glsl";
import fragmentShader from "./../../shaders/fragment.glsl";

import { useAudioPlayer } from "./../../composables/useAudioPlayer";

export default function Askobot({ socket }) {
  const { scene: model, animations } = useGLTF("/models/askobot_baked2.glb");
  const { actions, mixer } = useAnimations(animations, model);

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

  const equilizerMaterial = new ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: new Uniform(0),
      uIntensity: new Uniform(0),
      uBarNumber: new Uniform(10),
      uBarColor: new Uniform(new Color(0x3ddfff)),
    },
    vertexShader,
    fragmentShader,
  });

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
    socket.instance.on("voice-data", (data) => {
      if (data.channel === "#askowbol") {
        playAudio(data.audioBuffer);
      }
    });
  }, [socket]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    equilizerMaterial.uniforms.uTime.value = elapsed;
    equilizerMaterial.uniforms.uIntensity.value = analysis;
  });

  return (
    <>
      <Float speed={5} rotationIntensity={0.2} floatIntensity={0.2}>
        <primitive position-y={2.7} object={model} />
      </Float>
    </>
  );
}
