<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const file = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref("");
const username = ref("");
const avatar = ref("");

// taille et durée
const size = ref(50); // %
const duration = ref(10); // secondes
const useFullMedia = ref(false);

// légende + lien externe
const caption = ref("");
const externalUrl = ref("");

// état d'envoi
const isSubmitting = ref(false);

const getMediaType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "image";
  if (["mp4", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  return "image";
};

const hasFile = computed(() => !!file.value);
const hasExternal = computed(() => externalUrl.value.trim().length > 0);

// pour l'UX : source réellement utilisée
const effectiveSourceLabel = computed(() => {
  if (hasExternal.value && hasFile.value) return "Lien externe (prioritaire sur le fichier)";
  if (hasExternal.value) return "Lien externe";
  if (hasFile.value) return "Fichier local";
  return "Aucun média sélectionné";
});

// Détection du type d'embed pour la preview
const embedType = computed<"youtube" | "tiktok" | "twitch" | "other" | null>(() => {
  const url = externalUrl.value.trim().toLowerCase();
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("twitch.tv")) return "twitch";
  return "other";
});

const embedPreviewUrl = computed(() => {
  const url = externalUrl.value.trim();
  if (!url) return "";

  const type = embedType.value;

  if (type === "youtube") {
    const match = url.match(
      /(?:youtube\.com\/.*v=|youtu\.be\/)([^&#?/]+)/i
    );
    const videoId = match ? match[1] : null;
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0`;
  }

  if (type === "tiktok") {
    const match = url.match(/tiktok\.com\/.*video\/(\d+)/i);
    const videoId = match ? match[1] : null;
    if (!videoId) return url;
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  }

  if (type === "twitch") {
    const lower = url.toLowerCase();
    const host = window.location.hostname || "localhost";

    const vodMatch = lower.match(/twitch\.tv\/videos\/(\d+)/);
    if (vodMatch) {
      const videoId = vodMatch[1];
      return `https://player.twitch.tv/?video=${videoId}&parent=${host}&autoplay=false`;
    }

    const channelMatch = lower.match(/twitch\.tv\/([a-z0-9_]+)(?:\/)?$/);
    if (channelMatch) {
      const channel = channelMatch[1];
      return `https://player.twitch.tv/?channel=${channel}&parent=${host}&autoplay=false`;
    }

    return url;
  }

  // autre lien → on renvoie tel quel, l'embed pourra échouer mais au moins on tente
  return url;
});

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

const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    file.value = input.files[0];
    previewUrl.value = URL.createObjectURL(file.value);
    // reset options
    if (!useFullMedia.value) {
      duration.value = 10;
    }
  }
};

const handleSubmit = async () => {
  const trimmedUrl = externalUrl.value.trim();
  const useExternal = trimmedUrl.length > 0;

  if (!file.value && !useExternal) {
    alert("Sélectionne un fichier ou colle un lien externe");
    return;
  }
  if (isSubmitting.value) return;

  // limite de taille si fichier
  if (file.value && file.value.size > 50 * 1024 * 1024) {
    alert("❌ Fichier trop lourd (max 50 Mo)");
    return;
  }

  const formData = new FormData();

  formData.append("username", username.value);
  formData.append("avatarUrl", avatar.value);
  formData.append("displaySize", size.value.toString());
  formData.append("message", caption.value);

  if (useExternal) {
    formData.append("externalUrl", trimmedUrl);
  } else if (file.value) {
    formData.append("media", file.value);
    // optionnel, le back recalcule le type de toute façon
    const type = getMediaType(file.value.name);
    formData.append("type", type);
  }

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
      externalUrl.value = "";
      useFullMedia.value = false;
      duration.value = 10;
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
            <span class="text-accent font-semibold text-lg">
              {{ username }}
            </span>
          </div>

          <!-- Sélection fichier -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-accent">
              Fichier local (image, vidéo, audio, gif…)
            </label>
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="openFileDialog"
                class="px-3 py-2 rounded bg-soft border border-accent text-accent text-sm font-semibold hover:bg-accent hover:text-panel transition"
              >
                📂 Choisir un fichier
              </button>
              <span class="text-xs text-accent">
                <template v-if="file">
                  {{ file.name }}
                </template>
                <template v-else>
                  Aucun fichier sélectionné
                </template>
              </span>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFileChange"
            />
          </div>

          <!-- Lien externe -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-accent">
              Lien externe (YouTube, TikTok, Twitch…)
            </label>
            <input
              v-model="externalUrl"
              placeholder="https://youtu.be/..., https://www.twitch.tv/..., https://www.tiktok.com/..."
              class="w-full p-2 rounded bg-soft text-main text-sm"
            />
            <p class="text-xs text-accent mt-1">
              Si un lien est renseigné, il sera utilisé à la place du fichier.
            </p>
          </div>

          <!-- Info source -->
          <p class="text-xs text-accent/80">
            Source utilisée : <span class="font-semibold">{{ effectiveSourceLabel }}</span>
          </p>

          <!-- Taille -->
          <div>
            <label class="block text-sm font-medium text-accent">
              Taille sur le stream
            </label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              v-model="size"
              class="w-full"
            />
            <p class="text-xs mt-1 text-accent">
              ~ {{ size }} % de la largeur de l'écran (approx. visuelle)
            </p>
          </div>

          <!-- Full / durée -->
          <div class="flex items-center gap-2">
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

          <div v-if="!useFullMedia">
            <label class="block text-sm font-medium text-accent">
              Durée max
            </label>
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                v-for="opt in [5, 10, 15, 20, 30, 60]"
                :key="opt"
                @click="duration = opt"
                class="px-2 py-1 rounded text-xs border"
                :class="
                  duration === opt
                    ? 'bg-accent text-panel border-accent'
                    : 'bg-soft text-accent border-accent/40 hover:border-accent'
                "
              >
                {{ opt }} s
              </button>
              <div class="flex items-center gap-1 text-xs text-accent mt-1">
                <span>ou</span>
                <input
                  type="number"
                  min="1"
                  max="600"
                  v-model.number="duration"
                  class="w-16 px-1 py-0.5 rounded bg-soft border border-accent/40 text-center"
                />
                <span>s</span>
              </div>
            </div>
            <p class="text-xs mt-1 text-accent">
              Durée actuelle : <strong>{{ duration }} secondes</strong>
            </p>
          </div>

          <!-- Légende -->
          <div>
            <label for="caption" class="block text-sm font-medium text-accent">
              Légende
            </label>
            <input
              id="caption"
              v-model="caption"
              placeholder="Ex: Sois drôle frère sinon c'est pas la peine !"
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
        <h2 class="text-2xl font-bold text-accent mb-2">👀 Aperçu</h2>
        <p class="text-xs text-accent mb-4">
          Ceci est une approximation de ce qui sera affiché sur l'overlay.
        </p>

        <div
          class="bg-soft rounded p-4 flex-1 overflow-auto flex flex-col items-center justify-center"
        >
          <!-- Preview lien externe prioritaire -->
          <template v-if="hasExternal">
            <div class="flex items-center gap-3 mb-4">
              <img
                :src="avatar"
                class="w-10 h-10 rounded-full border-2 border-accent"
              />
              <span class="text-accent font-semibold">
                {{ username || 'Invité' }}
              </span>
            </div>

            <template v-if="embedPreviewUrl">
              <iframe
                v-if="embedType === 'youtube' || embedType === 'tiktok' || embedType === 'twitch'"
                :src="embedPreviewUrl"
                class="rounded max-h-full max-w-full mb-2"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
              <p v-else class="text-xs text-accent text-center">
                Impossible de prévisualiser ce lien, mais il sera envoyé tel quel à l'overlay.
              </p>
            </template>

            <p v-if="caption" class="text-accent text-center italic mt-2">
              {{ caption }}
            </p>
          </template>

          <!-- Preview fichier local -->
          <template v-else-if="previewUrl">
            <div class="flex items-center gap-3 mb-4">
              <img
                :src="avatar"
                class="w-10 h-10 rounded-full border-2 border-accent"
              />
              <span class="text-accent font-semibold">
                {{ username || 'Invité' }}
              </span>
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

          <!-- Aucun média -->
          <template v-else>
            <p class="italic text-sm text-accent">
              Aucun média sélectionné pour le moment.
            </p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
