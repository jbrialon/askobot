<script setup>
import { Environment } from "@tresjs/cientos";
</script>

<template>
  <TresDirectionalLight :intensity="1" :position="[5, 5, 5]" />
  <TresAmbientLight :intensity="0.8" />
  <Suspense>
    <Environment files="/textures/large_corridor_2k.hdr" />
  </Suspense>
</template>
