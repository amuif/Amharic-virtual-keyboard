import { defineConfig } from 'vite';

export default defineConfig({
  root: './src/demo/',
  server: {
    open: true,
    port: 3000
  },
  esbuild:{target:'esnext'}
});
