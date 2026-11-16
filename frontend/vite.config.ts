import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Development: /api so'rovlari backendga (5000) proksi qilinadi — cookie bitta domen ostida ishlaydi
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          codemirror: ['codemirror', '@codemirror/view', '@codemirror/state', '@codemirror/lang-html', '@codemirror/lang-css', '@codemirror/lang-javascript', '@codemirror/theme-one-dark'],
          charts: ['recharts'],
        },
      },
    },
  },
});
