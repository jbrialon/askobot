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

// Store
import { useStore } from "../../store/store";

const ASKOBOT_TRANSFORMS = {
  live: {
    position: { x: 1.5, y: 2.7, z: -1 },
    rotationY: 0,
  },
  default: {
    position: { x: 0.5, y: 2.8, z: 1 },
    rotationY: Math.PI * 0.07,
  },
};

export default function Askobot() {
  const manager = new Manager();
  const scene = useStore((state) => state.scene);
  const isFirstLoad = useRef(true);
  const askobotRef = useRef();
  const { barColor, barNumber, power } = useControls("Equilizer", {
    barNumber: {
      value: 10,
      step: 1,
      min: 2,
      max: 60,
    },
    barColor: "#3ddfff",
    power: {
      value: 15,
      step: 0.1,
      min: 1,
      max: 20,
    },
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

  const onPlayCallback = () => {
    console.log("askobot talk start");
  };

  const onEndedCallback = () => {
    console.log("askobot talk end");
  };

  useEffect(() => {
    equilizerMaterial.uniforms.uBarNumber.value = barNumber;
    equilizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equilizerMaterial]);

  useEffect(() => {
    const handler = (e) => {
      const { audioBuffer } = e.detail;
      playAudio({
        source: audioBuffer,
        volume: 0.3,
        loop: false,
        onPlay: onPlayCallback,
        onEnded: onEndedCallback,
      });
    };
    manager.on("voice-data", handler);

    return () => manager.off("voice-data", handler);
  }, []);

  useEffect(() => {
    if (!askobotRef.current) return;

    const { position, rotationY } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

    // we set the initial position and rotation of the bot depending on the scene on first load,
    // we want to animate it after
    if (isFirstLoad.current) {
      askobotRef.current.position.set(position.x, position.y, position.z);
      askobotRef.current.rotation.y = rotationY;
      isFirstLoad.current = false;
    } else {
      gsap.to(askobotRef.current.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: 1.5,
        ease: "power2.inOut",
        delay: 1,
      });

      gsap.to(askobotRef.current.rotation, {
        y: rotationY,
        duration: 1.75,
        ease: "elastic.out",
        delay: 2.25,
      });
    }
  }, [scene]);

  useEffect(() => {
    let rotationTween = null;

    const handler = (e) => {
      const analysis = Math.pow(e.detail * 0.85, 8);
      console.log(analysis);

      if (analysis > 0.0225) {
        if (rotationTween && rotationTween.isActive()) return;

        rotationTween = gsap.to(askobotRef.current.rotation, {
          x: Math.PI * 0.025,
          duration: 0.25,
          repeat: 1,
          yoyo: true,
          // ease: "power1.inOut",
        });

        console.log("dance");
      }
    };
    manager.on("start-audio", handler);

    return () => manager.off("start-audio", handler);
  }, [manager]);

  useFrame((state) => {
    // equilizerMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    equilizerMaterial.uniforms.uIntensity.value = Math.pow(
      analysis * 0.85,
      power,
    );
  });

  return (
    <>
      <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
        <primitive ref={askobotRef} object={model} />
      </Float>
    </>
  );
}
