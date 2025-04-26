import { useEffect } from "react";
import { useAudioPlayer } from "./../../composables/useAudioPlayer";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store/store";
import Manager from "../../classes/manager";

export default function Start() {
  const manager = new Manager();
  const scene = useStore((state) => state.scene);
  const isOBS = useStore((state) => state.isOBS);

  const { analysis, playAudio, pauseAudio } = useAudioPlayer();

  useEffect(() => {
    if (scene === "start" && isOBS) {
      playAudio({
        source: "/audio/start.mp3",
        volume: 0.15,
        loop: true,
      });
    } else {
      pauseAudio();
    }
  }, [scene, isOBS]);

  useFrame(() => {
    if (analysis) {
      manager.trigger("audio-startScene", analysis);
    }
  });

  return <></>;
}
