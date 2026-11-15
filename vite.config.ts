/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build 1: HTML pages — the standalone demo (dist/demo) and the extension popup (dist/extension).
// The demo is the default build; the popup is emitted into dist/extension by a second input set.
const target = process.env.CORTEX_TARGET ?? 'demo';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: target === 'popup' ? 'src/extension' : 'src/demo',
  publicDir: target === 'popup' ? resolve(__dirname, 'public') : false,
  build: {
    outDir: resolve(__dirname, target === 'popup' ? 'dist/extension' : 'dist/demo'),
    emptyOutDir: true,
    rollupOptions: {
      input: target === 'popup'
        ? { popup: resolve(__dirname, 'src/extension/popup.html') }
        : { index: resolve(__dirname, 'src/demo/index.html') },
    },
  },
  test: {
    root: __dirname,
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
