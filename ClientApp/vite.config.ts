import { defineConfig } from 'vite';

export default defineConfig({
  // This tells Vite where your index.html is
  root: './', 
  base: './',
  build: {
    // This forces the output folder to be created
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Main page
        main: './index.html',
  jewelry: './jewelry.html'
      },
    },
  }
});
