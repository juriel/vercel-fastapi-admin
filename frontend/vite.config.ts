import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Single-page app: one index.html, client-side routing via @vaadin/router
// (see src/components/app-root.ts). The backend's catch-all always serves
// this same index.html for any non-API, non-static path.
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
})
