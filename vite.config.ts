import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-redirects',
      apply: 'build',
      writeBundle() {
        const src = path.resolve(__dirname, 'public', '_redirects')
        const dest = path.resolve(__dirname, 'dist', '_redirects')

        try {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest)
            console.log('✅ _redirects copied to dist/')
          } else {
            console.warn('⚠️ public/_redirects not found.')
          }
        } catch (err) {
          console.error('❌ Error copying _redirects:', err)
        }
      }
    }
  ],
  base: '/',
  build: {
    outDir: 'dist',
  },
})
