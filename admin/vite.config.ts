import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Для прода на https://game.chesson.me/api/api/
const target = 'http://localhost:4000';
console.log(target);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: target,
        changeOrigin: true,
        secure: false,
      },
    }
  }
});
