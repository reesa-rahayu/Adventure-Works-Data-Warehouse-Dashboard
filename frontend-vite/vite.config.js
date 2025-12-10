// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Tambahkan bagian proxy ini:
    proxy: {
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
