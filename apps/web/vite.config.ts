import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Production security headers live in vercel.json; the dev and preview servers apply the same ones,
// so local runs and E2E tests see exactly what users get.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const securityHeaders = Object.fromEntries(vercel.headers.find((h) => h.source === '/(.*)')!.headers.map((h) => [h.key, h.value]));
// Vite's dev server injects inline scripts for HMR, so dev gets the same headers minus script-src strictness.
const devHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': securityHeaders['Content-Security-Policy']!.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace(
    "connect-src 'self'",
    "connect-src 'self' ws://localhost:*",
  ),
};

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('../../packages/tools/src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: 'Utility — developer tools in your browser',
        short_name: 'Utility',
        description: 'Developer tools that run entirely in your browser. Nothing you enter leaves your device.',
        theme_color: '#1c1815',
        background_color: '#1c1815',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,wasm}'],
        globIgnores: ['engines/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Heavy Tool engines are fetched from our own origin on first use, then cached for offline use.
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/engines/'),
            handler: 'CacheFirst',
            options: { cacheName: 'heavy-tool-engines', expiration: { maxEntries: 100 } },
          },
        ],
      },
    }),
  ],
  server: { headers: devHeaders },
  preview: { headers: securityHeaders },
  build: {
    target: 'es2023',
    sourcemap: false,
    reportCompressedSize: true,
    manifest: true,
  },
  worker: { format: 'es' },
});
