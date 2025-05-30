import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rollupOptions: {
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
