import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  build: {
    // This forces the 'dist' folder to appear inside ClientApp
    outDir: 'dist', 
    emptyOutDir: true,
  }
});
