import { AudioListener, Audio, AudioAnalyser } from "three";
import { ref } from "vue";

export function useAudioPlayer(camera) {
  const listener = new AudioListener();
  camera.value.add(listener);
  const sound = new Audio(listener);
  const analysis = ref(0);
  let analyser = null;

  const playAudio = (audioBuffer, onPlayCallback, onEndedCallback) => {
    const binaryAudio = atob(audioBuffer);
    const len = binaryAudio.length;
    const arrayBuffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arrayBuffer[i] = binaryAudio.charCodeAt(i);
    }

    listener.context.decodeAudioData(
      arrayBuffer.buffer,
      (decodedBuffer) => {
        sound.setBuffer(decodedBuffer);
        sound.setLoop(false);
        sound.setVolume(0.3);

        if (analyser && analyser.analyser) {
          analyser.analyser.disconnect();
          analyser = null;
        }
        analyser = new AudioAnalyser(sound, 32);

        sound.play();

        if (typeof onPlayCallback === "function") {
          onPlayCallback();
        }

        sound.source.onended = () => {
          sound.stop();
          sound.setBuffer(null);
          analysis.value = 0; // reset analysis when audio ends

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

  const updateAnalysis = () => {
    if (analyser) {
      analysis.value = Math.pow(
        (analyser.getFrequencyData()[2] / 255) * 0.85,
        8,
      );
    } else {
      analysis.value = 0;
    }
  };

  return { sound, listener, analyser, analysis, playAudio, updateAnalysis };
}
