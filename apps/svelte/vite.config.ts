import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    svelte(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.svelte', 'src/**/*.d.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**']
    })
  ],
  server: {
    port: 3000
  },
  build: {
    lib: {
      entry: './src/index.ts',
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


