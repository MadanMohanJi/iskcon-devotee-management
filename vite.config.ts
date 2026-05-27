import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // <-- This forces the browser to look for assets relative to index.html!
  build: {
    chunkSizeWarningLimit: 1000,
    // ... your manual chunks configuration setup
  }
});