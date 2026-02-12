<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import WaterGradientBackground from "../components/WaterGradientBackground.vue";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

const router = useRouter();
const API_URL = import.meta.env.VITE_API_BASE_URL;
const guilds = ref<Guild[]>([]);
const loading = ref(true);
const sessionChecked = ref(false);

// 🔐 Vérifie si la session est active
const checkSession = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return false;

    const data = await res.json();
    console.log("✅ Session confirmée pour :", data.username);
    return true;
  } catch (err) {
    console.error("❌ Erreur session :", err);
    return false;
  }
};

// 📡 Récupère la liste des serveurs
const fetchGuilds = async () => {
  try {
    const res = await fetch(`${API_URL}/api/auth/discord/guilds`, {
      credentials: "include",
    });

    const data = await res.json();
    guilds.value = data.guilds || data;
  } catch (err) {
    console.error("❌ Erreur fetch guilds", err);
  } finally {
    loading.value = false;
  }
};

// 👉 Quand l'utilisateur clique sur un serveur
const handleSelect = async (guild: Guild) => {
  try {
    const res = await fetch(
      `${API_URL}/api/auth/verify-role?guildId=${guild.id}`,
      {
        credentials: "include",
      }
    );

    console.log("📡 Statut HTTP /verify-role :", res.status);

    const data = await res.json();

    if (res.ok && data.authorized) {
      localStorage.setItem("role", data.role);
      localStorage.setItem("guildId", guild.id);
      router.push("/list-friends");
    } else {
      alert("❌ Tu n’as pas les permissions nécessaires sur ce serveur.");
      console.log("📂 Guilds visibles :", data);
    }
  } catch (err) {
    alert("Erreur lors de la vérification du rôle.");
    console.error(err);
  }
};

// ▶️ Initialisation
onMounted(async () => {
  const sessionOk = await checkSession();
  sessionChecked.value = true;

  if (sessionOk) {
    fetchGuilds();
  }
});
</script>

<template>
  <div v-if="!sessionChecked" class="text-accent">
    ⏳ Vérification de session...
  </div>

  <div class="relative min-h-screen text-main p-6 flex flex-col items-center">
    <WaterGradientBackground class="fixed inset-0 -z-10" />
    <div class="relative z-10 w-full flex flex-col items-center">
    <h1 class="text-3xl font-bold text-accent mb-4">🧭 Choisis un serveur</h1>

    <div v-if="loading" class="text-accent">Chargement des serveurs...</div>

    <div v-else-if="guilds.length === 0" class="text-accent">
      Aucun serveur trouvé. Le bot doit être présent sur au moins un serveur où
      tu es membre.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl"
    >
      <div
        v-for="guild in guilds"
        :key="guild.id"
        @click="handleSelect(guild)"
        class="cursor-pointer p-4 bg-panel rounded border border-accent hover:bg-accent hover:text-white transition"
      >
        <div class="flex items-center gap-4">
          <img
            v-if="guild.icon"
            :src="`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`"
            alt="icon"
            class="w-12 h-12 rounded-full object-cover"
          />
          <div
            v-else
            class="w-12 h-12 bg-gray-700 text-white uppercase text-lg font-bold rounded-full flex items-center justify-center"
          >
            {{ guild.name[0] }}
          </div>
          <div class="font-semibold truncate">{{ guild.name }}</div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
