<script setup>
// Socket
import Socket from "./Socket/Socket.js";

// Vue Components
import chat from "./components/chat.vue";

const socket = new Socket();
</script>

<template>
  <chat :socket="socket"></chat>
</template>

<style lang="scss">
#app {
  position: relative;
  width: 100vw;
  height: var(--vh);
  z-index: 20;
}
</style>
