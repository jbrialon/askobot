<script setup>
// Three.js Core
import { TresCanvas } from "@tresjs/core";
import { Grid, OrbitControls } from "@tresjs/cientos";

// Three.js Components
import Askobot from "./components/3d/askobot.vue";

// Vue.js
import chat from "./components/ui/chat.vue";

// Socket
import Socket from "./Socket/Socket.js";
const socket = new Socket();
</script>

<template>
  <TresCanvas powerPreference="high-performance">
    <TresPerspectiveCamera
      :position="[1.5, 3, 3.5]"
      :look-at="[0, 0, 0]"
      :fov="35"
    />
    <OrbitControls :target="[0, 3, 0]"></OrbitControls>
    <Suspense><Askobot :socket="socket"></Askobot></Suspense>

    <TresAmbientLight :intensity="0.8" />
    <TresDirectionalLight :intensity="2" :position="[-5, 3, 10]" />
    <Grid
      :args="[200, 100]"
      cell-color="#ffffff"
      :cell-size="0.6"
      :cell-thickness="0.5"
      section-color="#f0f0f0"
      :section-size="2"
      :section-thickness="1.3"
      :infinite-grid="true"
      :fade-from="0"
      :fade-distance="20"
      :fade-strength="1"
    ></Grid>
  </TresCanvas>
  <chat :socket="socket"></chat>
</template>

<style scoped></style>
