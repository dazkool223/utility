import { defineConfig } from '@playwright/test';

// Loads the packaged Chrome build (dist/chrome). Run `pnpm build` first.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  workers: 1,
});
