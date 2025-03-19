<script setup>
import { OrbitControls } from "@tresjs/cientos";
</script>

<template>
  <TresPerspectiveCamera
    :position="[1.5, 3, 3.5]"
    :look-at="[0, 0, 0]"
    :fov="35"
  />
  <OrbitControls :target="[0, 2.7, 0]"></OrbitControls>
</template>
