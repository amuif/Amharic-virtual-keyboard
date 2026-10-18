import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the demo page (index.html) as a static site for hosting.
// `vite.config.ts` builds the npm library instead.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
});
