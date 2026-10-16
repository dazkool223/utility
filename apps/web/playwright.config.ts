import { defineConfig, devices } from '@playwright/test';

// E2E runs against the production build served with the production security headers (see vite.config.ts).
// E2E_PORT / E2E_OUT let several people (or agents) run the suite at once without sharing a server or build folder.
const port = Number(process.env.E2E_PORT ?? 4173);
const outDir = process.env.E2E_OUT ?? 'dist';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm exec vite build --outDir ${outDir} && pnpm exec vite preview --outDir ${outDir} --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
