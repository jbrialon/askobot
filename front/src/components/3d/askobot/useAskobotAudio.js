import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useAudioPlayer } from "../../../composables/useAudioPlayer";

import { ASKOBOT_TRANSFORMS } from "./constants";
export default function useAskobotAudio(
  manager,
  scene,
  animations,
  askobotRef,
  equalizerMaterial,
) {
  const currentAnimation = useRef(null);
  const { analysis, playAudio } = useAudioPlayer();

  useEffect(() => {
    const handleVoiceData = (e) => {
      const { audioBuffer, content } = e.detail;
      const animation = content.animation;
      currentAnimation.current = animation;
      playAudio({
        source: audioBuffer || "/audio/error.mp3",
        volume: 0.3,
        loop: false,
        trim: 0,
        detune: Math.floor(Math.random() * 121) - 60, // between 60 and -60
        onPlay: () => {
          switch (animation) {
            case "dance":
              return animations.dance();
            case "spin":
              return animations.spin();
            case "excited":
              return animations.excited();
            case "looping":
              return animations.looping();
            default:
              return;
          }
        },
        onEnded: () => {
          currentAnimation.current = null;
          animations.wiggleAntennas();
        },
      });
    };

    manager.on("audio-voice", handleVoiceData);
    return () => manager.off("audio-voice", handleVoiceData);
  }, [manager, playAudio, animations]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Talking Animation
    if (askobotRef.current && currentAnimation.current === "talk") {
      const raw = Math.pow(analysis * 0.85, 15);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      const { position } =
        ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

      const amp = 0.01;
      const rotAmp = 0.05;

      askobotRef.current.position.y =
        position.y + Math.sin(time * 30) * amp * strength;
      askobotRef.current.rotation.x = Math.sin(time * 20) * rotAmp * strength;
    }

    // Equilizer Mouth
    equalizerMaterial.uniforms.uIntensity.value = Math.pow(analysis * 0.85, 15);
  });

  return { analysis };
}
