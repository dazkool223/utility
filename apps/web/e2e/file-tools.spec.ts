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

test('SQLite browser: a runaway query can be stopped and the Tool keeps working', async ({ page, browserName }) => {
  // Stopping starts a second worker. The Vite preview server answers that revalidation with a bare 304 that has no
  // Cross-Origin-Resource-Policy header, so WebKit refuses it. Production serves /assets/* as immutable and never revalidates.
  test.skip(browserName === 'webkit', 'preview server omits CORP on 304 responses');
  await page.goto('/office/sqlite');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/office-sample.sqlite');
  await expect(page.getByTestId('schema-list')).toBeVisible({ timeout: 30_000 });
  const editor = page.getByTestId('tool-input').locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c) SELECT count(*) FROM c;');
  await page.getByTestId('run').click();
  await page.getByTestId('stop').click();
  await expect(page.getByText(/The query was stopped and the database was reloaded/)).toBeVisible({ timeout: 30_000 });
  // The database was reopened, so ordinary queries work again.
  await expect(page.getByTestId('schema-list')).toBeVisible();
  await page.getByTestId('schema-list').getByRole('button').first().click();
  await expect(page.getByText(/The query was stopped/)).toBeHidden();
});

test('Calculator: an expression that would use gigabytes of memory is refused, not run', async ({ page }) => {
  await page.goto('/numbers/math');
  const content = page.getByTestId('tool-input').locator('.cm-content');
  await content.click();
  await content.fill('zeros(20000, 20000)');
  await expect(page.getByText(/too large for the calculator/)).toBeVisible({ timeout: 20_000 });
  await content.fill('2 + 2');
  await expect(output(page)).toContainText('4');
});
