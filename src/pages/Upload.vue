<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const file = ref<File | null>(null);
const previewUrl = ref("");
const username = ref("");
const avatar = ref("");
const size = ref(50);

const fullVideo = ref(true);
const duration = ref(5);
const caption = ref("");
const externalUrl = ref("");

const isVideoLink = (url: string) => {
  return /youtube\.com|youtu\.be|tiktok\.com|instagram\.com/.test(url);
};

watch(externalUrl, (val) => {
  const trimmed = val.trim();
  if (trimmed && trimmed.length > 5) {
    file.value = null;
    if (isVideoLink(trimmed)) {
      previewUrl.value = trimmed;
    }
  }
});

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    file.value = input.files[0];
    previewUrl.value = URL.createObjectURL(file.value);
    externalUrl.value = "";
  }
};

const handleSubmit = async () => {
  if (!file.value && !externalUrl.value.trim()) {
    return alert("❌ Aucun média fourni.");
  }

  const formData = new FormData();
  if (file.value) formData.append("media", file.value);
  if (externalUrl.value.trim())
    formData.append("externalUrl", externalUrl.value.trim());
  formData.append("username", username.value);
  formData.append("avatarUrl", avatar.value);
  formData.append("displaySize", size.value.toString());
  formData.append("message", caption.value);
  if (!fullVideo.value) {
    formData.append("duration", (duration.value * 1000).toString());
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    alert(
      res.ok ? "✅ Mème envoyé au stream !" : `❌ Erreur : ${data.message}`
    );

    if (res.ok) {
      file.value = null;
      externalUrl.value = "";
      previewUrl.value = "";
      caption.value = "";
    }
  } catch (err) {
    console.error(err);
    alert("❌ Erreur réseau.");
  }
};

onMounted(async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();

    if (!username.value) username.value = data.username;
    if (!avatar.value && data.avatarUrl) avatar.value = data.avatarUrl;
  } catch (e) {
    console.warn("❌ Erreur fetch /me :", e);
  }
});
</script>

<template>
  <div
    class="min-h-screen w-full p-6 bg-soft text-main flex justify-center items-center"
  >
    <div class="flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] h-[90vh]">
      <!-- Formulaire -->
      <div
        class="bg-panel p-6 rounded-xl border border-accent shadow-md flex-1 flex flex-col justify-between"
      >
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <h2 class="text-2xl font-bold text-accent mb-4">📤 Envoi de mème</h2>

          <div class="flex items-center gap-3 mb-4">
            <img
              v-if="avatar"
              :src="avatar"
              class="w-10 h-10 rounded-full border-2 border-accent"
            />
            <span class="text-accent font-semibold text-lg">{{
              username
            }}</span>
          </div>

          <div>
            <label for="media" class="block text-sm font-medium text-accent"
              >Fichier local</label
            >
            <input
              id="media"
              type="file"
              @change="handleFileChange"
              class="w-full p-2 rounded bg-soft text-main"
            />
          </div>

          <div>
            <label
              for="externalUrl"
              class="block text-sm font-medium text-accent"
              >Lien externe (YouTube, TikTok, Insta…)</label
            >
            <input
              id="externalUrl"
              v-model="externalUrl"
              placeholder="https://..."
              class="w-full p-2 rounded bg-soft text-main"
            />
            <p class="text-xs text-accent italic mt-1">
              Remplace le fichier si rempli
            </p>
          </div>

          <div>
            <label for="size" class="block text-sm font-medium text-accent"
              >Taille sur le stream (%)</label
            >
            <input
              id="size"
              type="number"
              min="10"
              max="100"
              v-model="size"
              class="w-full p-2 rounded bg-soft text-main"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="fullVideo"
              v-model="fullVideo"
              class="accent-accent"
            />
            <label for="fullVideo" class="text-sm text-accent"
              >Afficher toute la vidéo</label
            >
          </div>

          <div v-if="!fullVideo">
            <label for="duration" class="block text-sm font-medium text-accent"
              >Durée max (en s)</label
            >
            <input
              id="duration"
              type="number"
              min="1"
              max="60"
              v-model="duration"
              class="w-full p-2 rounded bg-soft text-main"
            />
          </div>

          <div>
            <label for="caption" class="block text-sm font-medium text-accent"
              >Légende à afficher</label
            >
            <input
              id="caption"
              v-model="caption"
              placeholder="Ex: Je passe à la télé !"
              class="w-full p-2 rounded bg-soft text-main"
            />
          </div>

          <button
            type="submit"
            class="w-full p-3 btn-primary font-bold rounded mt-4"
          >
            🚀 Envoyer
          </button>
        </form>
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
            <div class="flex items-center gap-3 mb-4" v-if="username || avatar">
              <img
                v-if="avatar"
                :src="avatar"
                class="w-10 h-10 rounded-full border-2 border-accent"
              />
              <span class="text-accent font-semibold">{{
                username || "Invité"
              }}</span>
            </div>

            <iframe
              v-if="isVideoLink(previewUrl)"
              :src="previewUrl"
              frameborder="0"
              allowfullscreen
              class="rounded w-full max-h-[300px]"
            ></iframe>

            <video
              v-else-if="file?.type.startsWith('video')"
              :src="previewUrl"
              controls
              class="rounded max-h-full max-w-full object-contain mb-2"
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
            <p class="italic text-sm text-accent">Aucun mème sélectionné</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
