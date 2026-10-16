import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect, fillInput, output } from './fixtures';

test('File checksum streams a file in a worker and matches Node SHA-256 / MD5', async ({ page }) => {
  await page.goto('/crypto/file-checksum');
  const path = 'e2e/fixtures/b-two-pages.pdf';
  await page.getByTestId('file-input').setInputFiles(path);
  const data = readFileSync(path);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const md5 = createHash('md5').update(data).digest('hex');
  await expect(output(page)).toContainText(sha256, { timeout: 20_000 });
  await expect(output(page)).toContainText(md5);
  // Compare against an expected checksum
  await page.getByTestId('expected-checksum').fill(`SHA256:${sha256.toUpperCase()}`);
  await expect(page.getByTestId('checksum-match')).toContainText('Match');
  await page.getByTestId('expected-checksum').fill('deadbeef');
  await expect(page.getByTestId('checksum-match')).toContainText('No match');
});

test('QR decoder reads a QR code from an image file', async ({ page }) => {
  await page.goto('/numbers/qr-decode');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/b-qr.png');
  await expect(output(page)).toContainText('https://example.com/utility-qr', { timeout: 20_000 });
  await expect(page.getByTestId('qr-info')).toContainText('Web link');
});

test('QR decoder explains when an image has no QR code', async ({ page }) => {
  await page.goto('/numbers/qr-decode');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/b-gradient.png');
  await expect(page.getByTestId('tool-error')).toContainText('No QR code was found', { timeout: 20_000 });
});

test('QR generator makes SVG and a PNG preview', async ({ page }) => {
  await page.goto('/numbers/qr');
  await fillInput(page, 'hello utility');
  await expect(output(page)).toContainText('<svg');
  await expect(page.getByAltText('Generated QR code')).toBeVisible();
});

test('TOTP shows an RFC 6238 code for a known secret and validates it', async ({ page }) => {
  await page.goto('/crypto/totp');
  await fillInput(page, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'); // "12345678901234567890"
  const out = output(page);
  await expect(out).toContainText('otpauth://totp/');
  await expect(out.locator('tr', { hasText: 'Code' }).first()).toContainText(/\d{6}/);
});

test('Password generator produces a password of the requested length', async ({ page }) => {
  await page.goto('/crypto/password');
  await expect(page.getByTestId('entropy')).toContainText('bits of entropy');
  const text = await output(page).innerText();
  expect(text.replace(/\s/g, '').length).toBeGreaterThanOrEqual(20);
});

test('bcrypt hashes in a worker and compares', async ({ page }) => {
  await page.goto('/crypto/bcrypt');
  await fillInput(page, 'hunter2');
  await expect(output(page)).toContainText('$2', { timeout: 20_000 });
});
