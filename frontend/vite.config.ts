import { resolve } from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Built as two fully separate single-entry builds (see package.json's
// build script) so Rollup never sees both pages at once and never
// extracts shared modules (session, api-client, ...) into their own
// chunk — each page compiles to exactly one self-contained JS file.
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, mode === 'login' ? 'login.html' : 'index.html'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
}))
