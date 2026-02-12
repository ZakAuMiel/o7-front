<script setup lang="ts">

import { ref } from "vue";
import confetti from "canvas-confetti";
import WaterGradientBackground from "../components/WaterGradientBackground.vue";
import { Font } from "three/examples/jsm/Addons.js";


// Page de connexion avec Discord
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// URL pour la connexion Discord
const discordLoginUrl = `${API_BASE_URL}/api/auth/login`;

const loginBtn = ref<HTMLElement | null>(null);

let lastBurst = 0;
const COOLDOWN_MS = 3000;

function fireEmojiConfetti() {
  const now = Date.now();
  if (now - lastBurst < COOLDOWN_MS) return;
  lastBurst = now;

  const rect = loginBtn.value?.getBoundingClientRect();
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
  const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.6;

  // ✅ Crée une "shape" à partir de l’emoji
  const salute = confetti.shapeFromText({ text: "🫡", scalar: 100 });

 confetti({
  particleCount: 100,
  spread: 200,
  startVelocity: 20,
  ticks: 70,
  gravity: 0.5,
  origin: { x, y },
  shapes: [salute],
  font: "120px sans-serif",
  flat: true, // ✅ rendu plus 2D
});
}


// Optionnel : mini pluie continue tant que hover (léger)
let hoverInterval: number | null = null;
function onHoverStart() {
  fireEmojiConfetti();
  hoverInterval = window.setInterval(() => fireEmojiConfetti(), 700);
}
function onHoverEnd() {
  if (hoverInterval) window.clearInterval(hoverInterval);
  hoverInterval = null;
}

</script>

<template>
   <div class="relative h-screen w-full overflow-hidden text-main">
    <WaterGradientBackground />

  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10"></div>


    <div class="relative z-10 h-full w-full flex items-center justify-center">
      <div class="flex flex-col md:flex-row gap-12 p-8 w-full max-w-6xl">
        <!-- Logo & Description -->
        <div
          class="flex-1 flex flex-col justify-center items-start text-left animate-fade-in"
        >
          <h1 class="text-6xl font-black tracking-wide text-primary logo-glow">
            🫡
          </h1>
          <p class="mt-4 text-lg text-accent max-w-md">
            Bienvenue sur <strong>o7</strong> – la plateforme où tes potes
            peuvent t'envoyer leurs mèmes en live. Authentifie-toi avec Discord
            et balance des clips, images ou gifs en temps réel sur le stream !
          </p>
        </div>

        <!-- Login Card -->
        <div class="flex-1 flex justify-center items-center">
          <div class="glass-card w-full max-w-md p-8">
            <h2 class="text-2xl font-bold text-accent mb-4">
              Connexion avec Discord
            </h2>
            <p class="text-sm text-accent mb-6">
              Seuls tes amis Discord ayant le lien peuvent s'authentifier et
              envoyer des contenus.
            </p>
            <a
              ref="loginBtn"
              @mouseenter="onHoverStart"
              @mouseleave="onHoverEnd"
              :href="discordLoginUrl"
              class="block w-full text-center bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
            >
              🔑 Se connecter via Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
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
    text-shadow: 0 0 14px rgba(255, 80, 5, 0.6),
      0 0 26px rgba(141, 125, 202, 0.5);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 120, 40, 0.9),
      0 0 40px rgba(141, 125, 202, 0.8);
  }
  100% {
    text-shadow: 0 0 14px rgba(255, 80, 5, 0.6),
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
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 32px rgba(141, 125, 202, 0.25);
  backdrop-filter: blur(18px);
}
</style>
