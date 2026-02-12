<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import WaterGradientBackground from "../components/WaterGradientBackground.vue";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const file = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref("");
const username = ref("");
const avatar = ref("");

const size = ref(50);
const duration = ref(10);
const useFullMedia = ref(false);
const caption = ref("");
const externalUrl = ref("");

const isSubmitting = ref(false);

// ---------- TYPES LAYOUT ----------
type TargetKey = "media" | "userInfo" | "message";

interface Rect {
  x: number; // en %
  y: number; // en %
  width: number; // en %
  height: number; // en %
}

interface Layout {
  media: Rect;
  userInfo: Rect;
  message: Rect;
}

// Layout par défaut (position approx sur un 16/9)
const layout = ref<Layout>({
  media: { x: 30, y: 35, width: 40, height: 35 },
  userInfo: { x: 40, y: 10, width: 20, height: 10 },
  message: { x: 35, y: 75, width: 30, height: 10 },
});

const hasFile = computed(() => !!file.value);
const hasExternal = computed(() => externalUrl.value.trim().length > 0);

const effectiveSourceLabel = computed(() => {
  if (hasExternal.value && hasFile.value)
    return "Lien externe (prioritaire sur le fichier)";
  if (hasExternal.value) return "Lien externe";
  if (hasFile.value) return "Fichier local";
  return "Aucun média sélectionné";
});

// ---------- TYPE DE MEDIA (fichier) ----------
const getMediaType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "image";
  if (["mp4", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
  return "image";
};

// ---------- TYPE D’EMBED (lien externe) ----------
const embedType = computed<"youtube" | "tiktok" | "twitch" | "other" | null>(
  () => {
    const url = externalUrl.value.trim().toLowerCase();
    if (!url) return null;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("twitch.tv")) return "twitch";
    return "other";
  }
);

const embedPreviewUrl = computed(() => {
  const url = externalUrl.value.trim();
  if (!url) return "";

  const type = embedType.value;

  if (type === "youtube") {
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&#?/]+)/i);
    const videoId = match ? match[1] : null;
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
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
      return `https://player.twitch.tv/?video=${videoId}&parent=${host}&autoplay=true&muted=true`;
    }

    const channelMatch = lower.match(/twitch\.tv\/([a-z0-9_]+)(?:\/)?$/);
    if (channelMatch) {
      const channel = channelMatch[1];
      return `https://player.twitch.tv/?channel=${channel}&parent=${host}&autoplay=true&muted=true`;
    }

    return url;
  }

  return url;
});

// ---------- DRAG & RESIZE LOGIC ----------
const stageRef = ref<HTMLElement | null>(null);

interface ActiveDrag {
  target: TargetKey;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  startRect: Rect;
}

const activeDrag = ref<ActiveDrag | null>(null);
let stageRect: DOMRect | null = null;

const startDrag = (event: PointerEvent, target: TargetKey) => {
  if (!stageRef.value) return;
  stageRect = stageRef.value.getBoundingClientRect();
  activeDrag.value = {
    target,
    mode: "move",
    startX: event.clientX,
    startY: event.clientY,
    startRect: { ...layout.value[target] },
  };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopDrag);
};

const startResize = (event: PointerEvent, target: TargetKey) => {
  event.stopPropagation();
  if (!stageRef.value) return;
  stageRect = stageRef.value.getBoundingClientRect();
  activeDrag.value = {
    target,
    mode: "resize",
    startX: event.clientX,
    startY: event.clientY,
    startRect: { ...layout.value[target] },
  };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopDrag);
};

const onPointerMove = (event: PointerEvent) => {
  const drag = activeDrag.value;
  if (!drag || !stageRect) return;

  const dxPercent = ((event.clientX - drag.startX) / stageRect.width) * 100;
  const dyPercent = ((event.clientY - drag.startY) / stageRect.height) * 100;

  const rect = { ...drag.startRect };
  const target = drag.target;
  const minSize = 5;

  if (drag.mode === "move") {
    let newX = rect.x + dxPercent;
    let newY = rect.y + dyPercent;
    newX = Math.max(0, Math.min(100 - rect.width, newX));
    newY = Math.max(0, Math.min(100 - rect.height, newY));
    layout.value[target].x = newX;
    layout.value[target].y = newY;
  } else {
    let newW = rect.width + dxPercent;
    let newH = rect.height + dyPercent;
    newW = Math.max(minSize, Math.min(100 - rect.x, newW));
    newH = Math.max(minSize, Math.min(100 - rect.y, newH));
    layout.value[target].width = newW;
    layout.value[target].height = newH;
  }
};

const stopDrag = () => {
  activeDrag.value = null;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", stopDrag);
};

onBeforeUnmount(() => {
  stopDrag();
});

// ---------- SESSION / FORM LOGIC ----------

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
    if (!useFullMedia.value) duration.value = 10;
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

  if (file.value && file.value.size > 50 * 1024 * 1024) {
    alert("❌ Fichier trop lourd (max 50 Mo)");
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("username", username.value);
    formData.append("avatarUrl", avatar.value);
    formData.append("displaySize", size.value.toString());
    formData.append("message", caption.value);
    formData.append("layout", JSON.stringify(layout.value)); // layout → back

    // 🔹 Lien externe prioritaire
    if (useExternal) {
      formData.append("externalUrl", trimmedUrl);
    }
    // 🔹 Sinon fichier local
    else if (file.value) {
      formData.append("media", file.value);
      const type = getMediaType(file.value.name);
      formData.append("type", type);
    }

    // Durée (en ms) si on ne veut pas le média complet
    if (!useFullMedia.value) {
      formData.append("duration", (duration.value * 1000).toString());
    }

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
  <div class="relative min-h-screen w-full p-6 text-main flex justify-center">
    <WaterGradientBackground class="fixed inset-0 -z-10" />
    <div class="relative z-10 w-full max-w-360 flex flex-col gap-6">

      <!-- FORMULAIRE EN HAUT -->
      <div
        class="bg-panel p-6 rounded-xl border border-accent shadow-md flex flex-col"
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
                <template v-else> Aucun fichier sélectionné </template>
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
            Source utilisée :
            <span class="font-semibold">{{ effectiveSourceLabel }}</span>
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
              Durée actuelle :
              <strong>{{ duration }} secondes</strong>
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

      <!-- APERÇU 16:9 EN BAS -->
      <div
        class="bg-panel p-6 rounded-xl border border-accent shadow-md flex flex-col"
      >
        <h2 class="text-2xl font-bold text-accent mb-2">👀 Aperçu</h2>
        <p class="text-xs text-accent mb-4">
          Ceci simule ton stream en 16:9 (équivalent 1280×720 / 1920×1080).
          Les positions et tailles sont les mêmes que sur l'overlay.
        </p>

        <div
          ref="stageRef"
          class="relative bg-soft rounded-lg overflow-hidden mx-auto"
          style="width: 100%; max-width: 1280px; aspect-ratio: 16 / 9"
        >
          <!-- Hint quand aucun média -->
          <p
            v-if="!hasExternal && !previewUrl"
            class="absolute text-xs text-accent/60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            Ajoute un fichier ou un lien pour prévisualiser le média.
          </p>

          <!-- Bloc USER INFO -->
          <div
            class="absolute rounded-lg px-2 py-1 flex items-center gap-2 bg-panel/80 border border-accent/60 cursor-move select-none"
            :style="{
              left: layout.userInfo.x + '%',
              top: layout.userInfo.y + '%',
              width: layout.userInfo.width + '%',
              height: layout.userInfo.height + '%',
            }"
            @pointerdown="(e) => startDrag(e, 'userInfo')"
          >
            <img
              :src="avatar"
              class="w-7 h-7 rounded-full border border-accent object-cover"
            />
            <span class="text-accent font-semibold text-xs truncate">
              {{ username || "Invité" }}
            </span>

            <div
              class="absolute right-0 bottom-0 w-3 h-3 bg-accent rounded-br-lg cursor-se-resize"
              @pointerdown="(e) => startResize(e, 'userInfo')"
            />
          </div>

          <!-- Bloc MEDIA -->
          <div
            class="absolute rounded-lg overflow-hidden bg-black cursor-move"
            :style="{
              left: layout.media.x + '%',
              top: layout.media.y + '%',
              width: layout.media.width + '%',
              height: layout.media.height + '%',
            }"
            @pointerdown="(e) => startDrag(e, 'media')"
          >
            <!-- Lien externe prioritaire -->
            <template v-if="hasExternal && embedPreviewUrl">
              <iframe
                v-if="embedType === 'youtube' || embedType === 'twitch'"
                :src="embedPreviewUrl"
                class="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
              <iframe
                v-else-if="embedType === 'tiktok'"
                :src="embedPreviewUrl"
                class="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-xs text-accent"
              >
                Lien non prévisualisable
              </div>
            </template>

            <!-- Sinon fichier local -->
            <template v-else-if="previewUrl">
              <video
                v-if="file?.type.startsWith('video')"
                :src="previewUrl"
                controls
                class="w-full h-full object-cover"
              />
              <audio
                v-else-if="file?.type.startsWith('audio')"
                :src="previewUrl"
                controls
                class="w-full"
              />
              <img
                v-else
                :src="previewUrl"
                class="w-full h-full object-cover"
              />
            </template>

            <div
              class="absolute right-0 bottom-0 w-3 h-3 bg-accent rounded-br-lg cursor-se-resize"
              @pointerdown="(e) => startResize(e, 'media')"
            />
          </div>

          <!-- Bloc MESSAGE -->
          <div
            class="absolute rounded-lg px-2 py-1 bg-panel/80 border border-accent/60 text-xs cursor-move select-none flex items-center"
            :style="{
              left: layout.message.x + '%',
              top: layout.message.y + '%',
              width: layout.message.width + '%',
              height: layout.message.height + '%',
            }"
            @pointerdown="(e) => startDrag(e, 'message')"
          >
            <span class="truncate w-full">
              {{ caption || "Légende (optionnelle)" }}
            </span>

            <div
              class="absolute right-0 bottom-0 w-3 h-3 bg-accent rounded-br-lg cursor-se-resize"
              @pointerdown="(e) => startResize(e, 'message')"
            />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
