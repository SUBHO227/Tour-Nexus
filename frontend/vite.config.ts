import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Charts, the graph canvas and the map are each heavy and only
        // used on some routes. Splitting them keeps the entry chunk small
        // and lets the browser cache them independently.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          flow: ['@xyflow/react'],
          map: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
