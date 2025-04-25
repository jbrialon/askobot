import { gsap } from "gsap";

// React
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";

// App
import Manager from "../../classes/manager";
import { useAudioPlayer } from "./../../composables/useAudioPlayer";
import useAskobotModel from "./askobot/useAskobotModel";
import useAskobotMaterials from "./askobot/useAskobotMaterials";
import useAskobotAnimation from "./askobot/useAskobotAnimation";
import useAskobotControls from "./askobot/useAskobotControls";

// Store
import { useStore } from "../../store/store";

// Constants
import { ASKOBOT_TRANSFORMS } from "./askobot/constants";

export default function Askobot() {
  const manager = new Manager();
  const scene = useStore((state) => state.scene);
  const isFirstLoad = useRef(true);
  const askobotRef = useRef();
  const currentAnimation = useRef(null);

  const { model, batteries, lens, lensMesh, wings, antennas, equilizer } =
    useAskobotModel();
  const { analysis, playAudio } = useAudioPlayer();
  const animations = useAskobotAnimation(askobotRef, scene, {
    wings,
    antennas,
    lens,
  });
  const { barNumber, barColor, power } = useAskobotControls(animations);
  const { lensMaterial, equalizerMaterial } = useAskobotMaterials(
    barNumber,
    barColor,
  );

  // Audio Callbacks
  const onPlayCallback = (animation) => {
    console.log("onPlayCallback animation:", animation);
    currentAnimation.current = animation;
    if (animation === "dance") {
      animations.dance();
    } else if (animation === "spin") {
      animations.spin();
    } else if (animation === "excited") {
      animations.excited();
    } else if (animation === "looping") {
      animations.looping();
    }
  };

  const onEndedCallback = (animation) => {
    currentAnimation.current = null;
    animations.wiggleAntennas();
  };

  // Hooks
  useEffect(() => {
    equalizerMaterial.uniforms.uBarNumber.value = barNumber;
    equalizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equalizerMaterial]);

  useEffect(() => {
    lensMesh.forEach((mesh) => (mesh.material = lensMaterial));
    equilizer.material = equalizerMaterial;
  }, [equilizer, lensMaterial, equalizerMaterial]);

  // Voice data
  useEffect(() => {
    const handler = (e) => {
      const { audioBuffer, user, content } = e.detail;
      playAudio({
        source: audioBuffer ? audioBuffer : "/audio/error.mp3",
        volume: 0.3,
        loop: false,
        trim: 0,
        detune: Math.floor(Math.random() * 121) - 60,
        onPlay: () => onPlayCallback(content.animation),
        onEnded: () => {
          onEndedCallback(content.animation);
        },
      });
    };
    manager.on("voice-data", handler);

    return () => manager.off("voice-data", handler);
  }, []);

  // update askobot position based on Scene
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
        onComplete: () => {
          animations.looping();
        },
      });

      gsap.to(askobotRef.current.rotation, {
        y: rotationY,
        duration: 1.75,
        ease: "elastic.out",
        delay: 2.25,
      });
    }
  }, [scene]);

  // Dance Intro animation (TODO: Enhance)
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
    manager.on("start-audio", handler);

    return () => manager.off("start-audio", handler);
  }, [manager]);

  // -----------------------------------------------------------------------------------
  // Update Loop
  // -----------------------------------------------------------------------------------
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = 12;

    // Battery position update
    batteries.forEach((battery, index) => {
      const offset = index * 3;
      const y = Math.cos(time * speed + offset) * 0.02 - 0.13;
      battery.position.y = y;
    });

    // Talking animation
    if (askobotRef.current && currentAnimation.current === "talk") {
      const raw = Math.pow(analysis * 0.85, power);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      const { position } =
        ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

      const amp = 0.01;
      const rotAmp = 0.05;

      askobotRef.current.position.y =
        position.y + Math.sin(time * 30) * amp * strength;
      askobotRef.current.rotation.x = Math.sin(time * 20) * rotAmp * strength;
    }

    equalizerMaterial.uniforms.uIntensity.value = Math.pow(
      analysis * 0.85,
      power,
    );
  });

  return (
    <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
      <primitive ref={askobotRef} object={model} />
    </Float>
  );
}

useGLTF.preload("/askobot_compressed.glb");
