<script setup>
import { gsap } from "gsap";
import {
  LoopOnce,
  MeshPhysicalMaterial,
  BackSide,
  Mesh,
  AudioListener,
  Audio,
  AudioAnalyser,
  AudioLoader,
} from "three";
import { ref, shallowRef } from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { useGLTF, useAnimations, Levioso } from "@tresjs/cientos";

const { camera } = useTresContext();
const props = defineProps({
  socket: {
    required: true,
    type: Object,
  },
});

const listener = new AudioListener();
camera.value.add(listener);

// create a global audio source
// Initialize sound once outside your callback
const sound = new Audio(listener);
const loader = new AudioLoader();

const askobotRef = shallowRef();
const floatFactor = ref(0.2);
const rotationFactor = ref(0.1);
const { scene: model, animations } = await useGLTF(
  "/models/askobot_baked.glb",
  {
    draco: true,
  },
);

const lensMaterial = new MeshPhysicalMaterial({
  metalness: 0.9,
  roughness: 0.05,
  envMapIntensity: 0.9,
  clearcoat: 1,
  transparent: true,
  opacity: 0.5,
  reflectivity: 0.2,
  ior: 0.9,
  color: 0xf0f0f0,
  side: BackSide,
});

model.traverse((child) => {
  if (child instanceof Mesh) {
    if (child.name.includes("Lens00")) {
      child.material = lensMaterial;
    }
  }
});

const { actions, mixer } = useAnimations(animations, model);
const defaultAction = ref(actions.Wiggle);
const idleAction = ref(actions["Basic BotAction.001"]);
const crossfadeDuration = 1.5; // duration in seconds

defaultAction.value.setLoop(LoopOnce, 1);
defaultAction.value.clampWhenFinished = true;
// defaultAction.value.play();

// idleAction.value.setLoop(LoopOnce, 1);
// idleAction.value.clampWhenFinished = true;
idleAction.value.play();

// mixer.addEventListener("finished", (e) => {
//   if (e.action.getClip().name === defaultAction.value.getClip().name) {
//     idleAction.value.reset().play();
//     defaultAction.value.crossFadeTo(idleAction.value, crossfadeDuration, false);

//     // After the crossfade duration, play the default action again
//     setTimeout(() => {
//       idleAction.value.reset().stop();
//       console.log("Crossfade complete, playing default action again.");
//       defaultAction.value.reset().play();
//     }, crossfadeDuration * 1000);
//   }
// });

// Listen for audio data response
let analyser;
props.socket.instance.on("voice-data", (base64Audio) => {
  // Stop any previous audio if it's currently playing
  if (sound.isPlaying) {
    sound.stop();
  }

  // Decode base64 to binary array
  const binaryAudio = atob(base64Audio);
  const len = binaryAudio.length;
  const arrayBuffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arrayBuffer[i] = binaryAudio.charCodeAt(i);
  }

  // Decode audio data to AudioBuffer
  listener.context.decodeAudioData(
    arrayBuffer.buffer,
    (audioBuffer) => {
      // Set audio buffer
      sound.setBuffer(audioBuffer);
      sound.setLoop(false);
      sound.setVolume(0.3);

      // Clean up previous analyser if exists
      if (analyser && analyser.analyser) {
        analyser.analyser.disconnect();
        analyser = null;
      }

      // Reinitialize analyser
      analyser = new AudioAnalyser(sound, 32);

      sound.play();

      // Animate with GSAP
      gsap.to(floatFactor, { value: 1, duration: 1 });
      gsap.to(rotationFactor, { value: 1, duration: 1 });

      sound.source.onended = () => {
        // When audio ends, reset animation values
        gsap.to(floatFactor, { value: 0.2, duration: 1 });
        gsap.to(rotationFactor, { value: 0.1, duration: 1 });

        // Explicitly stop and reset sound to free resources
        sound.stop();
        sound.setBuffer(null);
      };
    },
    (error) => {
      console.error("Audio decoding failed", error);
    },
  );
});

const { onAfterRender } = useLoop();

onAfterRender(({ renderer }) => {
  if (analyser) {
    let analysis = Math.pow((analyser.getFrequencyData()[2] / 255) * 0.85, 8);
    // TODO animate mouth
    console.log(analysis);
  }
});
</script>

<template>
  <Levioso
    :speed="5"
    :rotationFactor="rotationFactor"
    :floatFactor="floatFactor"
  >
    <primitive position-y="2.7" ref="askobotRef" :object="model"
  /></Levioso>
</template>
