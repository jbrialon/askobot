<script setup>
import { gsap } from "gsap";
import { LoopOnce } from "three";
import { ref, shallowRef, unref } from "vue";
import { useLoop } from "@tresjs/core";
import { useGLTF, useAnimations } from "@tresjs/cientos";

const { scene: model, animations } = await useGLTF("/models/askobot.glb", {
  draco: true,
});
const props = defineProps({
  socket: {
    required: true,
    type: Object,
  },
});
const askobotRef = shallowRef();
const { onBeforeRender } = useLoop();

const { actions, mixer } = useAnimations(animations, model);

const defaultAction = ref(actions.Wiggle);
const idleAction = ref(actions["Basic BotAction.001"]);

const crossfadeDuration = 1.5; // duration in seconds

defaultAction.value.setLoop(LoopOnce, 1);
defaultAction.value.clampWhenFinished = true;
defaultAction.value.play();

idleAction.value.setLoop(LoopOnce, 1);
idleAction.value.clampWhenFinished = true;
// idleAction.value.play();

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

onBeforeRender(({ delta, elapsed }) => {
  if (askobotRef.value) {
    // askobotRef.value.position.y = Math.sin(elapsed * 0.5) + 2;
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
