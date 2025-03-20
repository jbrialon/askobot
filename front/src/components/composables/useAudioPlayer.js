import { AudioListener, Audio, AudioAnalyser } from "three";

export function useAudioPlayer(camera) {
  const listener = new AudioListener();
  camera.value.add(listener);
  const sound = new Audio(listener);
  let analyser = null;

  /**
   * Plays the audio from the provided arrayBuffer and optionally triggers a callback.
   * @param {ArrayBuffer} arrayBuffer - The raw audio data.
   * @param {Function} [onPlayCallback] - Optional callback to trigger when audio starts playing.
   * @param {Function} [onEndedCallback] - Optional callback to trigger when audio finished playing.
   */
  const playAudio = (audioBuffer, onPlayCallback, onEndedCallback) => {
    // Decode base64 to binary array
    const binaryAudio = atob(audioBuffer);
    const len = binaryAudio.length;
    const arrayBuffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arrayBuffer[i] = binaryAudio.charCodeAt(i);
    }
    listener.context.decodeAudioData(
      arrayBuffer.buffer,
      (audioBuffer) => {
        sound.setBuffer(audioBuffer);
        sound.setLoop(false);
        sound.setVolume(0.3);

        // Disconnect previous analyser if any
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

  return { sound, listener, analyser, playAudio };
}
