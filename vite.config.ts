import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE_PATH is injected by GitHub Actions for each environment:
//   /main/  → blocks.ingeniables.com/main  (production)
//   /dev/   → blocks.ingeniables.com/dev   (development)
//   /Blockables/ (default) → GitHub Pages / local dev
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH ?? '/Blockables/',
})
