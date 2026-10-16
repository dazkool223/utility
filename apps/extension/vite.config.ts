import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Builds the Extension pages (full catalog tab + Quick Launcher popup) and the background worker.
// scripts/package.mjs then writes the Chrome and Firefox manifests (ADR 0002).
export default defineConfig({
  resolve: {
    alias: {
      '@': r('../../packages/tools/src'),
      '~web': r('../web/src'),
    },
  },
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist/build',
    emptyOutDir: true,
    target: 'es2023',
    modulePreload: false,
    rolldownOptions: {
      input: {
        app: r('app.html'),
        popup: r('popup.html'),
        background: r('src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  worker: { format: 'es' },
});
