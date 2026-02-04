import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(),
  dts({
    rollupTypes: true,
    include: ['src/**/*'],
    exclude: ['**/*.test.ts', '**/*.test.tsx']
  })],
  server: {
    port: 3000
  },
  build: {
    lib: {
      entry: './src/index.tsx',
      name: 'AmharicKeyboardReact',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild'
  }
});

