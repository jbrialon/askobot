<script setup>
import { gsap } from "gsap";
import { ref, shallowRef } from "vue";
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

const { actions } = useAnimations(animations, model);

console.log(actions);
const currentAction = ref(actions["Basic BotAction"]);

currentAction.value.play();

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
