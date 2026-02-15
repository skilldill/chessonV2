import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = 'https://game.chesson.me/'; // Для прода на 
// const target = 'http://localhost:4000'; // локально
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
