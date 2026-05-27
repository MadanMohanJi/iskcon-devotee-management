import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Ensures relative asset paths resolve flawlessly on GitHub Pages
  build: {
    chunkSizeWarningLimit: 1000, // Safe threshold allocation for modern dashboards
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Move core framework dependencies into a dedicated vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-core';
          }
          // Split the massive Firebase suite out of the main layout thread
          if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          // Split heavy document generation utilities
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-docs';
          }
          // Split look-and-feel animation UI systems
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
});