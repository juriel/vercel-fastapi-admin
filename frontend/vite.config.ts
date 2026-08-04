import { resolve } from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const entries: Record<string, string> = {
  main: 'index.html',
  login: 'login.html',
  register: 'register.html',
  'forgot-password': 'forgot-password.html',
}

// Built as fully separate single-entry builds (see package.json's build
// script) so Rollup never sees more than one page at once and never
// extracts shared modules (session, api-client, ...) into their own
// chunk — each page compiles to exactly one self-contained JS file.
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, entries[mode] ?? entries.main),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
}))
