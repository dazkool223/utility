import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures';

// The real IS-Net model runs here, on the CPU in headless browsers, so allow plenty of time.
test.setTimeout(300_000);

// WebKit builds without OffscreenCanvas get the Restriction in meta.ts instead of a working Tool.
async function skipWithoutOffscreenCanvas(page: import('@playwright/test').Page) {
  await page.goto('/images/background-remover');
  test.skip(await page.evaluate(() => typeof OffscreenCanvas === 'undefined'), 'This browser has no OffscreenCanvas; the Tool shows a Restriction instead');
}

const PHOTO = 'e2e/fixtures/images-photo.png';

async function downloadedPng(page: import('@playwright/test').Page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()]);
  expect(download.suggestedFilename()).toBe('images-photo-no-background.png');
  return readFileSync((await download.path())!);
}

/** PNG colour type is byte 25: 6 = RGBA, 4 = grey + alpha. */
const hasAlpha = (png: Buffer) => [4, 6].includes(png[25]!);

test('Background Remover: cuts out a picture and downloads a transparent PNG', async ({ page }) => {
  await skipWithoutOffscreenCanvas(page);
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByRole('button', { name: 'Remove background' }).click();
  await expect(page.getByTestId('before-after')).toBeVisible({ timeout: 280_000 });
  await expect(page.getByTestId('tool-error')).toHaveCount(0);

  const png = await downloadedPng(page);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(hasAlpha(png)).toBe(true);
  expect(png.readUInt32BE(16)).toBe(96); // width
  expect(png.readUInt32BE(20)).toBe(64); // height
});

test('Background Remover: puts the subject on a solid colour', async ({ page }) => {
  await skipWithoutOffscreenCanvas(page);
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByRole('radio', { name: 'Solid colour' }).click();
  await page.getByLabel('Colour').fill('#00aa00');
  await page.getByRole('button', { name: 'Remove background' }).click();
  await expect(page.getByTestId('before-after')).toBeVisible({ timeout: 280_000 });

  const png = await downloadedPng(page);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(96);
});
