<script setup lang="ts">
import WaterGradientBackground from "../components/WaterGradientBackground.vue";

// Page de connexion avec Discord
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// URL pour la connexion Discord
const discordLoginUrl = `${API_BASE_URL}/api/auth/login`;
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

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

/* Glow léger autour du logo 07 */
@keyframes glow-pulse {
  0% {
    text-shadow:
      0 0 14px rgba(255, 80, 5, 0.6),
      0 0 26px rgba(141, 125, 202, 0.5);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255, 120, 40, 0.9),
      0 0 40px rgba(141, 125, 202, 0.8);
  }
  100% {
    text-shadow:
      0 0 14px rgba(255, 80, 5, 0.6),
      0 0 26px rgba(141, 125, 202, 0.5);
  }
}
.logo-glow {
  animation: glow-pulse 2.8s ease-in-out infinite;
}

/* Carte légèrement glassy */
.glass-card {
  border-radius: 0.75rem;
  background: radial-gradient(
      circle at top left,
      rgba(255, 120, 40, 0.16),
      transparent 55%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(141, 125, 202, 0.18),
      transparent 55%
    ),
    rgba(10, 10, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.8),
    0 0 32px rgba(141, 125, 202, 0.25);
  backdrop-filter: blur(18px);
}
</style>
