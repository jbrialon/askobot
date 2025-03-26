<script setup>
import { gsap } from "gsap";
// Vue
import { ref, shallowRef, onMounted } from "vue";

// Three
import {
  LoopOnce,
  MeshPhysicalMaterial,
  BackSide,
  Mesh,
  Vector2,
  Uniform,
  ShaderMaterial,
} from "three";
import vertexShader from "./../../shaders/vertex.glsl";
import fragmentShader from "./../../shaders/fragment.glsl";

// Tres
import { useTresContext, useRenderLoop } from "@tresjs/core";
import { useGLTF, useAnimations, Levioso } from "@tresjs/cientos";
import { useAudioPlayer } from "../composables/useAudioPlayer";

// Component Logic
const { camera } = useTresContext();
const { playAudio, analysis, updateAnalysis } = useAudioPlayer(camera);
const props = defineProps({
  socket: {
    required: true,
    type: Object,
  },
});

const blobRef = shallowRef(null);

const { onLoop } = useRenderLoop();

const floatFactor = ref(0.2);
const rotationFactor = ref(0.1);
const { scene: model, animations } = await useGLTF(
  "/models/askobot_baked2.glb",
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

const equilizerMaterial = new ShaderMaterial({
  transparent: true,
  uniforms: {
    uTime: new Uniform(0),
    uIntensity: new Uniform(0),
    uAmplitude: new Uniform(new Vector2(0.4, 0.4)),
    uFrequency: new Uniform(new Vector2(20, 5)),
  },
  vertexShader,
  fragmentShader,
});

model.visible = false;
model.traverse((child) => {
  if (child instanceof Mesh) {
    if (child.name.includes("Lens00")) {
      child.material = lensMaterial;
    } else if (child.name.includes("equilizer")) {
      child.material = equilizerMaterial;
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

const onPlayCallback = () => {
  gsap.to(floatFactor, { value: 0.5, duration: 1 });
  gsap.to(rotationFactor, { value: 0.5, duration: 1 });
};

const onEndedCallback = () => {
  // When audio ends, reset animation values
  gsap.to(floatFactor, { value: 0.2, duration: 1 });
  gsap.to(rotationFactor, { value: 0.1, duration: 1 });
};

onLoop(({ elapsed }) => {
  updateAnalysis();
  equilizerMaterial.uniforms.uTime.value = elapsed;
  equilizerMaterial.uniforms.uIntensity.value = analysis.value;
});

onMounted(() => {
  props.socket.instance.on("voice-data", (data) => {
    if (data.channel === "#askowbol") {
      playAudio(data.audioBuffer, onPlayCallback, onEndedCallback);
    }
  });
  model.visible = true;
  // gsap.to(model.position, { y: 2.7, duration: 3, delay: 2 });
});
</script>

<template>
  <Levioso
    :speed="5"
    :rotationFactor="rotationFactor"
    :floatFactor="floatFactor"
  >
    <primitive position-y="2.7" :object="model"
  /></Levioso>
  <!-- <TresMesh ref="blobRef" :position="[0, 4, 0]">
    <TresPlaneGeometry :args="[1, 0.2, 20, 20]" />
    <TresShaderMaterial
      :vertex-shader="vertexShader"
      :fragment-shader="fragmentShader"
      :uniforms="uniforms"
    />
  </TresMesh> -->
</template>
