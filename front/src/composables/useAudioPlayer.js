import { useRef, useEffect, useState } from "react";
import { AudioListener, Audio, AudioAnalyser } from "three";
import { useThree, useFrame } from "@react-three/fiber";

export function useAudioPlayer() {
  const { camera } = useThree();

  const listenerRef = useRef(new AudioListener());
  const soundRef = useRef(new Audio(listenerRef.current));
  const analyserRef = useRef(null);
  const [analysis, setAnalysis] = useState(0);

  useEffect(() => {
    camera.add(listenerRef.current);
    return () => {
      camera.remove(listenerRef.current);
    };
  }, [camera]);

  const playAudio = (audioBuffer, onPlayCallback, onEndedCallback) => {
    const binaryAudio = atob(audioBuffer);
    const len = binaryAudio.length;
    const arrayBuffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arrayBuffer[i] = binaryAudio.charCodeAt(i);
    }

    listenerRef.current.context.decodeAudioData(
      arrayBuffer.buffer,
      (decodedBuffer) => {
        const sound = soundRef.current;
        sound.setBuffer(decodedBuffer);
        sound.setLoop(false);
        sound.setVolume(0.3);

        if (analyserRef.current && analyserRef.current.analyser) {
          analyserRef.current.analyser.disconnect();
          analyserRef.current = null;
        }
        analyserRef.current = new AudioAnalyser(sound, 32);

        sound.play();

        if (typeof onPlayCallback === "function") {
          onPlayCallback();
        }

        sound.source.onended = () => {
          sound.stop();
          sound.setBuffer(null);
          setAnalysis(0); // reset analysis when audio ends

          if (typeof onEndedCallback === "function") {
            onEndedCallback();
          }
        };
      },
      (error) => {
        console.error("Audio decoding failed", error);
      },
    );
  };

  useFrame(() => {
    if (analyserRef.current) {
      setAnalysis(
        Math.pow((analyserRef.current.getFrequencyData()[2] / 255) * 0.85, 8),
      );
    } else {
      setAnalysis(0);
    }
  });

  return {
    sound: soundRef.current,
    listener: listenerRef.current,
    analyser: analyserRef.current,
    analysis,
    playAudio,
  };
}
