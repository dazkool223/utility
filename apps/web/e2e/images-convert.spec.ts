import { readFileSync } from 'node:fs';
import { test, expect, output } from './fixtures';

const PHOTO = 'e2e/fixtures/images-photo.png';

async function downloadedBytes(page: import('@playwright/test').Page, name: string) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download', exact: true }).click()]);
  expect(download.suggestedFilename()).toBe(name);
  return readFileSync((await download.path())!);
}

test('Image converter: PNG to WebP, with a real WebP download', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByLabel('Convert to').selectOption('webp');
  await page.getByTestId('convert').click();
  await expect(output(page)).toContainText('WebP');
  await expect(output(page)).toContainText('96×64');
  await expect(page.getByTestId('image-preview')).toBeVisible();
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
  const bytes = await downloadedBytes(page, 'images-photo.webp');
  expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
});

test('Image converter: PNG to JPEG with transparency flattened', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/images-alpha.png');
  await page.getByLabel('Convert to').selectOption('jpeg');
  await page.getByTestId('convert').click();
  await expect(output(page)).toContainText('JPEG');
  const bytes = await downloadedBytes(page, 'images-alpha.jpg');
  expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
});

test('Image converter: JPEG to AVIF', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/images-photo.jpg');
  await page.getByLabel('Convert to').selectOption('avif');
  await page.getByTestId('convert').click();
  await expect(output(page)).toContainText('AVIF', { timeout: 45_000 });
  const bytes = await downloadedBytes(page, 'images-photo.avif');
  expect(bytes.subarray(4, 8).toString()).toBe('ftyp');
});

test('Image converter: JPEG XL and QOI, then back to PNG', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByLabel('Convert to').selectOption('jxl');
  await page.getByTestId('convert').click();
  await expect(output(page)).toContainText('JPEG XL', { timeout: 30_000 });
  const jxl = await downloadedBytes(page, 'images-photo.jxl');
  expect(jxl.length).toBeGreaterThan(100);

  await page.getByLabel('Convert to').selectOption('qoi');
  await page.getByTestId('convert').click();
  await expect(output(page)).toContainText('QOI');
  const qoi = await downloadedBytes(page, 'images-photo.qoi');
  expect(qoi.subarray(0, 4).toString()).toBe('qoif');
});

test('Image converter: several files give a zip', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles([PHOTO, 'e2e/fixtures/images-alpha.png']);
  await page.getByLabel('Convert to').selectOption('png');
  await page.getByTestId('convert').click();
  await expect(page.getByTestId('result-info')).toHaveCount(2);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download all (.zip)' }).click()]);
  expect(download.suggestedFilename()).toBe('converted-images.zip');
  const zip = readFileSync((await download.path())!);
  expect(zip.subarray(0, 2).toString()).toBe('PK');
});

test('Image converter: a file that is not an image shows a plain error', async ({ page }) => {
  await page.goto('/images/convert');
  await page.getByTestId('file-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('this is not an image at all') });
  await page.getByTestId('convert').click();
  await expect(page.getByTestId('tool-error')).toContainText('notes.txt');
  await expect(page.getByTestId('tool-error')).toContainText('not an image');
});

test('Image converter: declares its Restrictions up front', async ({ page }) => {
  await page.goto('/images/convert');
  // Restrictions sit in a collapsed container; open it to read them.
  await page.getByTestId('restrictions').locator('summary').click();
  await expect(page.getByText('AVIF encoding is slow on large images')).toBeVisible();
});
