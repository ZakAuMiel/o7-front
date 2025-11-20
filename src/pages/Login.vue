<script setup lang="ts">
// Page de connexion avec Discord
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// URL pour la connexion Discord
const discordLoginUrl = `${API_BASE_URL}/api/auth/login`;
</script>

<template>
  <div class="relative h-screen w-full overflow-hidden">

    <!-- 🎨 Background ShaderGradient avec fade-in -->
    <div class="absolute inset-0 -z-20 bg-fade-in">
      <iframe
        src="https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1&cAzimuthAngle=180&cDistance=2.8&cPolarAngle=80&cameraZoom=9.1&color1=%23606080&color2=%238d7dca&color3=%23212121&destination=onCanvas&embedMode=on&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1.9&positionX=0&positionY=0&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=50&rotationY=0&rotationZ=-60&shader=defaults&type=waterPlane&uAmplitude=0&uDensity=1.5&uFrequency=0&uSpeed=0.2&uStrength=1.5&uTime=8&wireframe=false"
        class="absolute inset-0 w-full h-full border-0"
        allowfullscreen
      ></iframe>

      <!-- Overlay foncé pour la lisibilité -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    </div>

    <!-- 🌟 Contenu -->
    <div
      class="relative z-10 h-full w-full flex items-center justify-center text-main px-4 md:px-8"
    >
      <div class="flex flex-col md:flex-row gap-12 w-full max-w-6xl">

        <!-- Logo & Description -->
        <div
          class="flex-1 flex flex-col justify-center items-start text-left animate-fade-in"
        >
          <h1
            class="text-6xl md:text-7xl font-black tracking-wide logo-glow"
          >
            07
          </h1>
          <p class="mt-4 text-lg text-accent max-w-md">
            Bienvenue sur <strong>07</strong> – la plateforme où tes potes
            peuvent t'envoyer leurs mèmes en live. Authentifie-toi avec Discord
            et balance des clips, images ou gifs en temps réel sur le stream !
          </p>
        </div>

        <!-- Login Card glassy -->
        <div class="flex-1 flex justify-center items-center">
          <div class="glass-card w-full max-w-md p-8">
            <h2 class="text-2xl font-bold text-accent mb-4">
              Connexion avec Discord
            </h2>
            <p class="text-sm text-accent/90 mb-6">
              Seuls tes amis Discord ayant le lien peuvent s'authentifier et
              envoyer des contenus.
            </p>
            <a
              :href="discordLoginUrl"
              class="block w-full text-center bg-primary text-white font-semibold py-3 rounded-lg transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200"
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
/* Fade-in du contenu texte */
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

/* Fade-in du background ShaderGradient */
@keyframes bg-fade-in {
  from {
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.bg-fade-in {
  opacity: 0;
  animation: bg-fade-in 1.2s ease-out forwards;
}

/* Glow rose/orangé autour du logo 07 */
@keyframes glow-pulse {
  0% {
    text-shadow:
      0 0 16px rgba(255, 80, 5, 0.65),
      0 0 32px rgba(255, 111, 97, 0.55),
      0 0 48px rgba(192, 132, 252, 0.35);
  }
  50% {
    text-shadow:
      0 0 22px rgba(255, 120, 40, 0.9),
      0 0 42px rgba(255, 150, 130, 0.8),
      0 0 64px rgba(216, 180, 254, 0.6);
  }
  100% {
    text-shadow:
      0 0 16px rgba(255, 80, 5, 0.65),
      0 0 32px rgba(255, 111, 97, 0.55),
      0 0 48px rgba(192, 132, 252, 0.35);
  }
}
.logo-glow {
  color: #f97316; /* au cas où text-primary soit différent */
  animation: glow-pulse 2.8s ease-in-out infinite;
}

/* Carte super glassy */
.glass-card {
  border-radius: 1rem;
  background: radial-gradient(
      circle at top left,
      rgba(255, 120, 40, 0.14),
      transparent 55%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(192, 132, 252, 0.18),
      transparent 55%
    ),
    rgba(10, 10, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.75),
    0 0 40px rgba(248, 113, 113, 0.18);
  backdrop-filter: blur(22px);
}
</style>
