<script setup>
// Three.js Components
import Experience from "./components/3d/experience.vue";

// Vue.js
import Chat from "./components/ui/chat.vue";

// Classes
import Socket from "./classes/socket.js";

const socket = new Socket();
</script>

<template>
  <Experience :socket="socket"></Experience>
  <Chat :socket="socket"></Chat>
</template>

<style scoped></style>
