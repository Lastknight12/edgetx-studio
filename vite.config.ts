import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env.FENGARICONF': 'undefined',
  },
  plugins: [vue(), vueDevTools(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'fengari',
              test: /node_modules[\\/]fengari[\\/]/,
              priority: 20,
            },
            {
              name: 'image-import',
              test: /node_modules[\\/]gifuct-js[\\/]/,
              priority: 20,
            },
            {
              name: 'export',
              test: /node_modules[\\/]jszip[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              minSize: 20000,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      os: fileURLToPath(new URL('./src/shims/browserOs.ts', import.meta.url)),
    },
  },
})
