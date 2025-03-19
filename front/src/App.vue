<script setup>
// Three.js Components
import Experience from "./components/3d/experience.vue";

// Vue.js
import Chat from "./components/ui/chat.vue";

// Classes
import Socket from "./socket/Socket.js";
import Debug from "./classes/Debug.js";

const socket = new Socket();
const debug = new Debug();
</script>

<template>
  <Experience :socket="socket" :debug="debug"></Experience>
  <Chat :socket="socket"></Chat>
</template>

<style scoped></style>
