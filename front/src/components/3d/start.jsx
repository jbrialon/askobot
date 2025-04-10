import { useEffect } from "react";
import { useAudioPlayer } from "./../../composables/useAudioPlayer";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store/store";
import Manager from "../../classes/manager";

export default function Start() {
  const scene = useStore((state) => state.scene);

  const manager = new Manager();

  const { analysis, playAudio, pauseAudio } = useAudioPlayer();

  useEffect(() => {
    if (scene === "start") {
      playAudio({
        source: "/audio/start.mp3",
        volume: 0.15,
        loop: true,
      });
    } else {
      pauseAudio();
    }
  }, [scene]);

  useFrame(() => {
    if (analysis) {
      manager.trigger("start-audio", analysis);
    }
  });

  return <></>;
}
