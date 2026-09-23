import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Le serveur tourne dans un container, les sources sont montées depuis
    // l'hôte : sans polling le hot reload ne voit pas les écritures.
    watch: {
      usePolling: true,
    },
  },
})
