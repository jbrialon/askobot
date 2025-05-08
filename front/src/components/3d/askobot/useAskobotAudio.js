import { MathUtils } from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

// Composables
import { useAudioPlayer } from "../../../composables/useAudioPlayer";

// Audio
import soundEvents from "../../../classes/sound-events";

export default function useAskobotAudio(
  manager,
  scene,
  animations,
  botRef,
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

  // on Mounted
  useEffect(() => {
    soundEvents.load("zoom");
    soundEvents.load("whoosh", 4);
  }, []);

  useFrame((state) => {
    if (!botRef.current) return;

    const time = state.clock.getElapsedTime();
    const bot = botRef.current;

    // Talking Animation
    if (currentAnimation.current === "talk") {
      const raw = Math.pow(analysis * 0.85, 15);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      const amp = 0.01;
      const rotAmp = 0.05;
      const targetPositionY = Math.sin(time * 30) * amp * strength;
      bot.position.y = MathUtils.lerp(bot.position.y, targetPositionY, 0.2);
      const targetRotationX = Math.sin(time * 20) * rotAmp * strength;
      bot.position.y = MathUtils.lerp(bot.rotation.x, targetRotationX, 0.2);
    }

    // Dancing Animation on start
    if (analysisRef.current && scene === "start") {
      const rotAmp = 0.2;

      const targetRotationX =
        Math.sin(time * 12.5) * rotAmp * analysisRef.current;

      // smoothing factor
      // 0.2 = smooth and responsive
      // 0.05 = even smoother (more inertia)
      // 1 = no smoothing (immediate jump)
      bot.rotation.x = MathUtils.lerp(bot.rotation.x, targetRotationX, 0.01);
    }

    // Equilizer Mouth
    equalizerMaterial.uniforms.uIntensity.value = Math.pow(analysis * 0.85, 15);
  });

  return { analysis };
}
