<script setup>
import { gsap } from "gsap";
// Vue
import { ref, onMounted, onBeforeUnmount } from "vue";

// Three
import {
  LoopOnce,
  MeshPhysicalMaterial,
  BackSide,
  Mesh,
  Uniform,
  ShaderMaterial,
  Color,
} from "three";
import vertexShader from "./../../shaders/vertex.glsl";
import fragmentShader from "./../../shaders/fragment.glsl";

// Tres
import { useTresContext, useRenderLoop } from "@tresjs/core";
import { useGLTF, useAnimations, Levioso } from "@tresjs/cientos";

// Other
import { useAudioPlayer } from "../composables/useAudioPlayer";

// props
const props = defineProps({
  socket: {
    required: true,
    type: Object,
  },
  debug: {
    required: true,
    type: Object,
  },
});

// Debug
const debugObject = {
  fields: {
    barNumber: 10,
    barColor: 0x3ddfff,
  },
  folder: null,
  setDebug: (ui) => {
    debugObject.folder = props.debug.ui.addFolder({
      title: "Equilizer",
    });

    debugObject.folder
      .addBinding(debugObject.fields, "barNumber", {
        label: "Bar Number",
        min: 1,
        max: 20,
        step: 1,
      })
      .on("change", () => {
        equilizerMaterial.uniforms.uBarNumber.value =
          debugObject.fields.barNumber;
      });

    debugObject.folder
      .addBinding(debugObject.fields, "barColor", {
        view: "color",
      })
      .on("change", () => {
        equilizerMaterial.uniforms.uBarColor.value = new Color(
          debugObject.fields.barColor,
        );
      });
  },
  removeDebug: () => {
    debugObject.folder.dispose();
  },
};

// Component Logic
const { onLoop } = useRenderLoop();
const { camera } = useTresContext();
const { playAudio, analysis, updateAnalysis } = useAudioPlayer(camera);

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
    uBarNumber: new Uniform(debugObject.fields.barNumber),
    uBarColor: new Uniform(new Color(debugObject.fields.barColor)),
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
  debugObject.setDebug();
});

onBeforeUnmount(() => {
  debugObject.removeDebug();
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
</template>
