<script setup lang="ts">
import { TresCanvas } from "@tresjs/core";
</script>

<template>
  <TresCanvas
    class="absolute inset-0 -z-20"
    clear-color="#ff00ff"
    window-size
  >
    <TresPerspectiveCamera :position="[0, 2, 5]" :look-at="[0, 0, 0]" />

    <TresAmbientLight :intensity="1" />
    <TresDirectionalLight :position="[2, 3, 2]" :intensity="1" />

    <TresMesh>
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="#ffffff" />
    </TresMesh>
  </TresCanvas>
</template>
