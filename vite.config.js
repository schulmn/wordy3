import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        results: resolve(__dirname, 'src/game-results.html')
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
