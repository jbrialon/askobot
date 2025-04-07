import { useEffect } from "react";
import { useAudioPlayer } from "./../../composables/useAudioPlayer";
import { useFrame } from "@react-three/fiber";
import Manager from "../../classes/manager";

export default function Start() {
  const manager = new Manager();

  const { analysis, playAudio, pauseAudio } = useAudioPlayer();

  useEffect(() => {
    const handler = (e) => {
      const scene = e.detail.name;
      if (scene === "start") {
        playAudio({
          source: "/audio/start.mp3",
          volume: 0.15,
          loop: true,
        });
      } else {
        pauseAudio();
      }
    };
    manager.on("obs-scene-changed", handler);

    return () => manager.off("obs-scene-changed", handler);
  }, [manager]);

  useFrame(() => {
    if (analysis) {
      manager.trigger("start-audio", analysis);
    }
  });

  return <></>;
}
