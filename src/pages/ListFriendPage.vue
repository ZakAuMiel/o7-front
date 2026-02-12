<script setup lang="ts">
  // Add Vite env type declaration for TypeScript
  /// <reference types="vite/client" />
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import WaterGradientBackground from '../components/WaterGradientBackground.vue';
  
  interface AllowedUser {
    userId: string;
    username: string;
    avatarUrl: string;
    roleName: 'streamer' | 'ami';
  }
  
  const streamers = ref<AllowedUser[]>([]);
  const friends = ref<AllowedUser[]>([]);
  const router = useRouter();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const goToUpload = () => {
    router.push('/upload');
  };
  
  onMounted(async () => {
    try {
      const guildId = localStorage.getItem('guildId');
      const res = await fetch(`${API_URL}/api/auth/list-allowed-users?guildId=${guildId}`, {
        credentials: 'include'
      });
  
      const data = await res.json();
      if (Array.isArray(data)) {
        streamers.value = data.filter((u) => u.roleName === 'streamer');
        friends.value = data.filter((u) => u.roleName === 'ami');
      }
    } catch (err) {
      console.error('Erreur récupération des membres :', err);
    }
  });
</script>

<template>
    <div class="relative min-h-screen text-main p-6">
      <WaterGradientBackground class="fixed inset-0 -z-10" />
      <div class="relative z-10">
        <h1 class="text-3xl font-bold text-accent mb-6">👥 Membres autorisés</h1>
    
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Streamers -->
        <div>
          <h2 class="text-2xl font-semibold text-accent mb-4">🎥 Streamers</h2>
          <div v-if="streamers.length === 0" class="text-muted">Aucun streamer trouvé.</div>
          <div class="flex flex-col gap-4">
            <div
              v-for="user in streamers"
              :key="user.userId"
              class="flex items-center justify-between bg-panel rounded-xl shadow p-4 border border-accent/30"
            >
              <div class="flex items-center gap-4">
                <img
                  :src="user.avatarUrl"
                  class="w-12 h-12 rounded-full object-cover"
                  alt="avatar"
                />
                <div>
                  <div class="font-semibold">{{ user.username }}</div>
                  <span class="inline-block text-xs font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    Streamer
                  </span>
                </div>
              </div>
              <button
                class="text-sm font-semibold text-white bg-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-700/90"
                @click="goToUpload"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
  
        <!-- Amis -->
        <div>
          <h2 class="text-2xl font-semibold text-accent mb-4">💬 Amis</h2>
          <div v-if="friends.length === 0" class="text-muted">Aucun ami trouvé.</div>
          <div class="flex flex-col gap-4">
            <div
              v-for="user in friends"
              :key="user.userId"
              class="flex items-center bg-panel rounded-xl shadow p-4 border border-accent/30"
            >
              <img
                :src="user.avatarUrl"
                class="w-12 h-12 rounded-full object-cover mr-4"
                alt="avatar"
              />
              <div>
                <div class="font-semibold">{{ user.username }}</div>
                <span class="inline-block text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  Ami
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </template>
  

  
  <style scoped>
  .text-muted {
    color: #888;
  }
  </style>
  