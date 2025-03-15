<script setup>
import { gsap } from "gsap";
import { LoopOnce, MeshPhysicalMaterial, BackSide, Mesh } from "three";
import { ref, shallowRef } from "vue";
import { useGLTF, useAnimations } from "@tresjs/cientos";

const props = defineProps({
  socket: {
    required: true,
    type: Object,
  },
});

const askobotRef = shallowRef();
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
defaultAction.value.play();

idleAction.value.setLoop(LoopOnce, 1);
idleAction.value.clampWhenFinished = true;

mixer.addEventListener("finished", (e) => {
  if (e.action.getClip().name === defaultAction.value.getClip().name) {
    idleAction.value.reset().play();
    defaultAction.value.crossFadeTo(idleAction.value, crossfadeDuration, false);

    // After the crossfade duration, play the default action again
    setTimeout(() => {
      idleAction.value.reset().stop();
      console.log("Crossfade complete, playing default action again.");
      defaultAction.value.reset().play();
    }, crossfadeDuration * 1000);
  }
});

props.socket.instance.on("history", (chatHistory) => {
  // gsap.to(askobotRef.value.position, {
  //   y: "+=1",
  //   yoyo: true,
  //   duration: 0.1,
  //   repeat: 5,
  //   onComplete: () => {
  //     askobotRef.value.position.y = 0;
  //   },
  // });
});
</script>

<template>
  <primitive position-y="2" ref="askobotRef" :object="model" />
</template>
