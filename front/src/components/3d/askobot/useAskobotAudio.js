import { MathUtils } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

// Composables
import { useAudioPlayer } from "../../../composables/useAudioPlayer";

export default function useAskobotAudio(
  manager,
  scene,
  animations,
  askobotRef,
  equalizerMaterial,
) {
  const currentAnimation = useRef(null);
  const analysisRef = useRef(0);
  const { analysis, playAudio } = useAudioPlayer();

  // Voice Event
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
        onPlay: () => {
          animations.blink();
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
          animations.blink();
          animations.wiggleAntennas();
        },
      });
    };

    manager.on("audio-voice", handleVoiceData);
    return () => manager.off("audio-voice", handleVoiceData);
  }, [manager, playAudio, animations]);

  // Start Scene song Event
  useEffect(() => {
    const handler = (e) => {
      const raw = Math.pow(e.detail * 0.85, 15);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      analysisRef.current = strength;
    };

    manager.on("audio-startScene", handler);
    return () => manager.off("audio-startScene", handler);
  }, [manager]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Talking Animation
    if (askobotRef.current && currentAnimation.current === "talk") {
      const raw = Math.pow(analysis * 0.85, 15);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      const amp = 0.01;
      const rotAmp = 0.05;
      const targetPositionY = Math.sin(time * 30) * amp * strength;
      askobotRef.current.position.y = MathUtils.lerp(
        askobotRef.current.position.y,
        targetPositionY,
        0.2,
      );
      const targetRotationX = Math.sin(time * 20) * rotAmp * strength;
      askobotRef.current.position.y = MathUtils.lerp(
        askobotRef.current.rotation.x,
        targetRotationX,
        0.2,
      );
    }

    // Dancing Animation on start
    if (askobotRef.current && analysisRef.current && scene === "start") {
      const rotAmp = 0.2;

      const targetRotationX =
        Math.sin(time * 12.5) * rotAmp * analysisRef.current;

      //smoothing factor
      // 0.2 = smooth and responsive
      // 0.05 = even smoother (more inertia)
      // 1 = no smoothing (immediate jump)
      askobotRef.current.rotation.x = MathUtils.lerp(
        askobotRef.current.rotation.x,
        targetRotationX,
        0.2,
      );
    }

    // Equilizer Mouth
    equalizerMaterial.uniforms.uIntensity.value = Math.pow(analysis * 0.85, 15);
  });

  return { analysis };
}
