<script setup lang="ts">
import { ref, onMounted } from "vue";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const file = ref<File | null>(null);
const previewUrl = ref("");
const username = ref("");
const avatar = ref("");
const size = ref(50);
const duration = ref(5); // en secondes
const useFullMedia = ref(false);
const caption = ref("");
const isSubmitting = ref(false);

const getMediaType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "image";
  if (["mp4", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  return "image";
};

const checkSession = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });
    if (res.status === 401) {
      window.location.href = "/#/login";
      return false;
    }
    const data = await res.json();
    username.value = data.username;
    avatar.value = data.avatarUrl;
    return true;
  } catch {
    window.location.href = "/#/login";
    return false;
  }
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    file.value = input.files[0];
    previewUrl.value = URL.createObjectURL(file.value);
    // reset options
    useFullMedia.value = false;
    duration.value = 5;
  }
};

const handleSubmit = async () => {
  if (!file.value) {
    alert("Aucun fichier sélectionné");
    return;
  }
  if (isSubmitting.value) return;

  // limite de taille (ex: 50 Mo)
  if (file.value.size > 50 * 1024 * 1024) {
    alert("❌ Fichier trop lourd (max 50 Mo)");
    return;
  }

  const formData = new FormData();
  formData.append("media", file.value);
  formData.append("username", username.value);
  formData.append("avatarUrl", avatar.value);
  formData.append("displaySize", size.value.toString());
  formData.append("message", caption.value);

  const type = getMediaType(file.value.name);
  formData.append("type", type);

  // Durée pour TOUT (audio + vidéo + éventuellement image)
  // uniquement si on ne veut pas le média complet
  if (!useFullMedia.value) {
    formData.append("duration", (duration.value * 1000).toString());
  }

  isSubmitting.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json();
    alert(res.ok ? "✅ Mème envoyé !" : `❌ Erreur : ${data.message}`);

    if (res.ok) {
      file.value = null;
      previewUrl.value = "";
      caption.value = "";
      useFullMedia.value = false;
      duration.value = 5;
    }
  } catch (err) {
    console.error(err);
    alert("❌ Erreur réseau");
  } finally {
    isSubmitting.value = false;
  }
};

const sendEmergencyCut = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/shutdown`, {
      method: "POST",
      credentials: "include",
    });
    alert("🚨 Overlay coupé en urgence");
  } catch {
    alert("❌ Impossible d'envoyer la commande d'arrêt");
  }
};

onMounted(async () => {
  await checkSession();
});
</script>

<template>
  <div
    class="min-h-screen w-full p-6 bg-soft text-main flex justify-center items-center"
  >
    <div class="flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] h-[90vh]">
      <!-- Form -->
      <div
        class="bg-panel p-6 rounded-xl border border-accent shadow-md flex-1 flex flex-col justify-between"
      >
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <h2 class="text-2xl font-bold text-accent mb-4">🎬 Envoi de mème</h2>

          <div class="flex items-center gap-3 mb-4">
            <img
              :src="avatar"
              class="w-10 h-10 rounded-full border-2 border-accent"
            />
            <span class="text-accent font-semibold text-lg">{{
              username
            }}</span>
          </div>

          <label for="file" class="text-sm text-accent">
            Sélectionne un fichier (image, vidéo, audio, gif… et me fais pas
            ban)
          </label>
          <input
            id="file"
            type="file"
            @change="handleFileChange"
            class="w-full p-2 rounded bg-soft text-main"
          />

          <div>
            <label for="size" class="block text-sm font-medium text-accent"
              >Taille sur le stream (%)</label
            >
            <input
              type="range"
              min="10"
              max="100"
              v-model="size"
              class="w-full"
            />
            <p class="text-xs mt-1 text-accent">{{ size }}%</p>
          </div>

          <!-- Full média -->
          <div class="flex items-center gap-2" v-if="file">
            <input
              type="checkbox"
              id="useFullMedia"
              v-model="useFullMedia"
              class="accent-accent"
            />
            <label for="useFullMedia" class="text-sm text-accent">
              Afficher tout le média (évite ça me coûte bcp d'argent wallah)
            </label>
          </div>

          <!-- Durée personnalisée (pour tout média, sauf si full) -->
          <div v-if="file && !useFullMedia">
            <label for="duration" class="block text-sm font-medium text-accent">
              Durée max (s)
            </label>
            <input
              type="range"
              min="1"
              max="60"
              v-model="duration"
              class="w-full"
            />
            <p class="text-xs mt-1 text-accent">{{ duration }} secondes</p>
          </div>

          <div>
            <label for="caption" class="block text-sm font-medium text-accent"
              >Légende</label
            >
            <input
              id="caption"
              v-model="caption"
              placeholder="Ex: Soit drôle frère sinon c'est pas la peine !"
              class="w-full p-2 rounded bg-soft text-main"
            />
          </div>

          <button
            type="submit"
            class="w-full p-3 btn-primary font-bold rounded mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "⏳ Envoi..." : "🚀 Envoyer" }}
          </button>
        </form>

        <button
          @click="sendEmergencyCut"
          class="mt-6 p-3 bg-red-600 text-white rounded font-bold shadow-md"
        >
          🚨 Cut le média BORDEL !
        </button>
      </div>

      <!-- Aperçu -->
      <div
        class="bg-panel p-6 rounded-xl border border-accent shadow-md flex-1 flex flex-col"
      >
        <h2 class="text-2xl font-bold text-accent mb-4">👀 Aperçu</h2>
        <div
          class="bg-soft rounded p-4 flex-1 overflow-auto flex flex-col items-center justify-center"
        >
          <template v-if="previewUrl">
            <div class="flex items-center gap-3 mb-4">
              <img
                :src="avatar"
                class="w-10 h-10 rounded-full border-2 border-accent"
              />
              <span class="text-accent font-semibold">{{
                username || "Invité"
              }}</span>
            </div>

            <video
              v-if="file?.type.startsWith('video')"
              :src="previewUrl"
              controls
              class="rounded max-h-full max-w-full object-contain mb-2"
            />
            <audio
              v-else-if="file?.type.startsWith('audio')"
              :src="previewUrl"
              controls
              class="w-full max-w-md mb-2"
            />
            <img
              v-else
              :src="previewUrl"
              class="rounded max-h-full max-w-full object-contain mb-2"
            />

            <p v-if="caption" class="text-accent text-center italic mt-2">
              {{ caption }}
            </p>
          </template>
          <template v-else>
            <p class="italic text-sm text-accent">Aucun meme sélectionné</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
