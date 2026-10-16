import { readFileSync } from 'node:fs';
import { test, expect, output } from './fixtures';

const PHOTO = 'e2e/fixtures/images-photo.png'; // 96 × 64
const JPG = 'e2e/fixtures/images-photo.jpg';

async function download(page: import('@playwright/test').Page, name: string | RegExp) {
  const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
  return { name: d.suggestedFilename(), bytes: readFileSync((await d.path())!) };
}

test('Image resizer: halves a picture and downloads a real PNG', async ({ page }) => {
  await page.goto('/images/resize');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await expect(page.getByTestId('resize-plan')).toContainText('96×64');
  await page.getByLabel('Width (px)').fill('48');
  await expect(page.getByTestId('resize-plan')).toContainText('→ 48×32');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('result-info')).toContainText('48×32');
  const file = await download(page, 'Download');
  expect(file.name).toBe('images-photo-48x32.png');
  expect(file.bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(file.bytes.readUInt32BE(16)).toBe(48);
  expect(file.bytes.readUInt32BE(20)).toBe(32);
});

test('Image resizer: percent mode, and a size that is too big is refused', async ({ page }) => {
  await page.goto('/images/resize');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByRole('radio', { name: 'Percent' }).click();
  await expect(page.getByTestId('resize-plan')).toContainText('→ 48×32');
  await page.getByRole('radio', { name: 'Pixels' }).click();
  await page.getByLabel('Width (px)').fill('16384');
  await expect(page.getByTestId('tool-error')).toContainText('megapixels');
});

test('Image compressor: shows before and after sizes and downloads', async ({ page }) => {
  await page.goto('/images/compress');
  await page.getByTestId('file-input').setInputFiles(JPG);
  await expect(page.getByTestId('result-info')).toContainText('→', { timeout: 30_000 });
  const file = await download(page, /^Download /);
  expect(file.name).toBe('images-photo-compressed.jpg');
  expect([...file.bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
});

test('Image crop and rotate: turning swaps the sides', async ({ page }) => {
  await page.goto('/images/crop-rotate');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByTestId('rotate-right').click();
  await expect(page.getByTestId('edit-summary')).toContainText('64×96');
  await expect(page.getByTestId('edit-summary')).toContainText('rotated 90°');
  await expect(page.getByTestId('region-picker')).toBeVisible();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('result-info')).toContainText('64×96');
  const file = await download(page, 'Download');
  expect(file.bytes.readUInt32BE(16)).toBe(64);
  expect(file.bytes.readUInt32BE(20)).toBe(96);
});

test('Image annotate: covering an area and adding text gives a saved picture', async ({ page }) => {
  await page.goto('/images/annotate');
  await page.getByTestId('file-input').setInputFiles(PHOTO);
  await page.getByTestId('add-redact').click();
  await page.getByTestId('add-text').click();
  await expect(page.getByTestId('annotation-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('picker-image')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('run').click();
  await expect(page.getByTestId('result-info')).toContainText('96×64');
  const file = await download(page, 'Download');
  expect(file.name).toBe('images-photo-annotated.png');
});

test('PDF signature validator: an unsigned PDF has no signatures', async ({ page }) => {
  await page.goto('/pdf/validate-signature');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/b-two-pages.pdf');
  await expect(page.getByTestId('result-summary')).toContainText('no digital signatures');
});

test('PDF OCR: reads the text of a PDF and offers a searchable PDF', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/pdf/ocr');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/b-two-pages.pdf');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('ocr-text')).toHaveValue(/Page\s*1/, { timeout: 200_000 });
  await expect(page.getByTestId('result-summary')).toContainText('2 pages');
  const pdf = await download(page, 'Download searchable PDF');
  expect(pdf.name).toBe('b-two-pages-searchable.pdf');
  expect(pdf.bytes.subarray(0, 5).toString()).toBe('%PDF-');
});

test('Audio converter: converts a WAV to MP3', async ({ page }) => {
  await page.goto('/media/audio-convert');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/media-tone.wav');
  await page.getByLabel('Convert to').selectOption('mp3');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('result-summary')).toContainText('media-tone.mp3', { timeout: 60_000 });
  const file = await download(page, /^Download media-tone\.mp3/);
  expect(file.bytes.length).toBeGreaterThan(500);
});

test('Magic decoder: peels Base64 off a sentence', async ({ page }) => {
  await page.goto('/binary/magic');
  const content = page.getByTestId('tool-input').locator('.cm-content');
  await content.click();
  await content.fill('SGVsbG8sIHRoaXMgaXMgYSBwZXJmZWN0bHkgbm9ybWFsIHNlbnRlbmNlIHRoYXQgd2FzIGVuY29kZWQgd2l0aCBCYXNlNjQu');
  await expect(output(page)).toContainText('perfectly normal sentence');
});
