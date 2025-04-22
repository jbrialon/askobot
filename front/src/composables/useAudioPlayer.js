import { useRef, useEffect, useState } from "react";
import { AudioListener, Audio, AudioAnalyser, AudioLoader } from "three";
import { useThree, useFrame } from "@react-three/fiber";

export function useAudioPlayer() {
  const { camera } = useThree();

  const listenerRef = useRef(new AudioListener());
  const soundRef = useRef(new Audio(listenerRef.current));
  const analyserRef = useRef(null);
  const [analysis, setAnalysis] = useState(0);
  const audioLoader = new AudioLoader();

  useEffect(() => {
    camera.add(listenerRef.current);
    return () => {
      camera.remove(listenerRef.current);
    };
  }, [camera]);

  const playAudio = ({
    source, // string (base64 or .mp3 path)
    volume = 0.3,
    loop = false,
    trim = 0,
    detune,
    onPlay,
    onEnded,
  }) => {
    const sound = soundRef.current;
    const handleDecodedBuffer = (decodedBuffer) => {
      sound.detune = detune;
      sound.setBuffer(decodedBuffer);
      sound.setLoop(loop);
      sound.setVolume(volume);

      if (analyserRef.current && analyserRef.current.analyser) {
        analyserRef.current.analyser.disconnect();
        analyserRef.current = null;
      }
      analyserRef.current = new AudioAnalyser(sound, 32);
      sound.play();

      const totalDuration = decodedBuffer.duration;
      const stopTime = (totalDuration - trim) * 1000;

      const stopTimeout = setTimeout(() => {
        if (sound.isPlaying) {
          sound.stop();
          sound.setBuffer(null);
          setAnalysis(0);
          if (typeof onEnded === "function") {
            onEnded();
          }
        }
      }, stopTime);

      if (typeof onPlay === "function") {
        onPlay();
      }

      sound.source.onended = () => {
        clearTimeout(stopTimeout);
        sound.stop();
        sound.setBuffer(null);
        setAnalysis(0);
        if (typeof onEnded === "function") {
          onEnded();
        }
      };
    };

    if (source.trim().toLowerCase().endsWith(".mp3")) {
      audioLoader.load(source, handleDecodedBuffer, undefined, (error) =>
        console.error("Audio loading failed", error),
      );
    } else {
      try {
        const binaryAudio = atob(source);
        const len = binaryAudio.length;
        const uint8Array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          uint8Array[i] = binaryAudio.charCodeAt(i);
        }

        listenerRef.current.context.decodeAudioData(
          uint8Array.buffer,
          handleDecodedBuffer,
          (error) => console.error("Audio decoding failed", error),
        );
      } catch (err) {
        console.error("Invalid base64 audio data", err);
      }
    }
  };

  const pauseAudio = () => {
    const sound = soundRef.current;
    if (sound.isPlaying) {
      sound.pause();
    }
  };

  const stopAudio = () => {
    const sound = soundRef.current;
    if (sound.isPlaying) {
      sound.stop();
      sound.setBuffer(null);
      setAnalysis(0);
    }
  };

  useFrame(() => {
    if (analyserRef.current) {
      setAnalysis(analyserRef.current.getFrequencyData()[2] / 255);
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
    pauseAudio,
    stopAudio,
  };
}
