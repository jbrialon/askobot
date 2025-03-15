<script setup>
// Three.js Core
import * as THREE from "three";

import { TresCanvas } from "@tresjs/core";
import { OrbitControls, Environment, Grid } from "@tresjs/cientos";

THREE.ColorManagement.enabled = true;

const gl = {
  shadows: false,
  alpha: true,
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  powerPreference: "high-performance",
  dpr: Math.min(window.devicePixelRatio, 2),
};

// Three.js Components
import Askobot from "./components/3d/askobot.vue";

// Vue.js
import chat from "./components/ui/chat.vue";

// Socket
import Socket from "./socket/Socket.js";
const socket = new Socket();
</script>

<template>
  <TresCanvas v-bind="gl">
    <TresPerspectiveCamera
      :position="[1.5, 3, 3.5]"
      :look-at="[0, 0, 0]"
      :fov="35"
    />
    <OrbitControls :target="[0, 2.7, 0]"></OrbitControls>
    <Suspense><Askobot :socket="socket"></Askobot></Suspense>
    <Suspense>
      <Environment files="/textures/large_corridor_2k.hdr" />
    </Suspense>
    <Grid
      :args="[200, 100]"
      cell-color="#ffffff"
      :cell-size="0.5"
      :cell-thickness="0.5"
      section-color="#f0f0f0"
      :section-size="2"
      :section-thickness="1.3"
      :infinite-grid="true"
      :fade-from="0"
      :fade-distance="20"
      :fade-strength="1"
    ></Grid>
    <TresDirectionalLight :intensity="1" :position="[2, 3, -3]" />
    <TresAmbientLight :intensity="0.8" />
  </TresCanvas>
  <chat :socket="socket"></chat>
</template>

<style scoped></style>
