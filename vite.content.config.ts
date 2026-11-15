import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build 2: the content script as a single classic (IIFE) script, as MV3 content scripts require.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: resolve(__dirname, 'dist/extension'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/extension/content.tsx'),
      name: 'CortexContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
  },
});
