import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: './src',
  plugins: [svelte(), dts()],
  server: {
    port: 3000
  },
  build: {
    lib: {
      entry: '/index.ts',
      name: 'AmharicKeyboardSvelte',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
        },
      },
    },
    outDir: 'dist'
  }
});


