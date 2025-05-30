import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rollupOptions: {
      // petite astuce vite : hook post-build manuel
      plugins: [
        {
          name: 'copy-redirects',
          writeBundle() {
            copyFileSync(
              resolve(__dirname, 'public/redirects'),
              resolve(__dirname, 'dist/_redirects')
            )
          }
        }
      ]
    }
  }
})
