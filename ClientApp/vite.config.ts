import { defineConfig } from 'vite';

export default defineConfig({
  // This makes sure your JS and CSS paths load correctly on GitHub
  base: './', 
  root: './',
  build: {
    outDir: 'dist',
  }
});
