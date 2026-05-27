import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // <-- This forces assets to resolve relative to where index.html is loaded!
  build: {
    // ... rest of your rollup manual chunks configuration
  }
});