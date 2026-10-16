import { test, expect, fillInput, output } from './fixtures';

const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

test('serves the strict security headers', async ({ page }) => {
  const res = await page.goto('/');
  const headers = res!.headers();
  expect(headers['content-security-policy']).toContain("connect-src 'self'");
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-embedder-policy']).toBe('require-corp');
});

test('home page lists Tools and searches by alias', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('tool-card-json-format')).toBeVisible();
  await page.getByTestId('home-search').fill('b64');
  await expect(page.getByTestId('tool-card-base64-text')).toBeVisible();
  await page.getByTestId('tool-card-base64-text').click();
  await expect(page).toHaveURL(/\/encoders\/base64$/);
});

test('command palette opens with the shortcut and navigates', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(`${MOD}+k`);
  await expect(page.getByTestId('palette')).toBeVisible();
  await page.getByTestId('palette-input').fill('json formatter');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/json\/format$/);
  await expect(page.getByTestId('palette')).toHaveCount(0);
});

test('palette Smart Paste opens the Tool with the pasted data', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(`${MOD}+k`);
  await page.getByTestId('palette-input').fill('{"pasted":true}');
  await page.getByText('Open in JSON Formatter').click();
  await expect(page).toHaveURL(/\/json\/format$/);
  await expect(output(page)).toContainText('"pasted": true');
});

test('home Smart Paste suggests Tools for pasted text', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('smart-paste').fill('SGVsbG8sIHdvcmxkIQ==');
  await page.getByTestId('smart-base64-text').click();
  await expect(output(page)).toContainText('Hello, world!');
});

test('favourites and recent Tools persist, and never store Tool Input', async ({ page }) => {
  await page.goto('/json/format');
  await fillInput(page, '{"secret":"do-not-store"}');
  await page.getByTestId('favourite').click();
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Favourites' }).getByTestId('tool-card-json-format')).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).toContain('json-format');
  expect(stored).not.toContain('do-not-store');
});

test('Run shortcut and copy-output shortcut work', async ({ page, browserName }) => {
  await page.goto('/crypto/uuid');
  const first = await output(page).innerText();
  await page.keyboard.press(`${MOD}+Enter`);
  await expect(output(page)).not.toHaveText(first);
  await page.keyboard.press('Alt+Shift+C');
  if (browserName === 'chromium') {
    await expect(page.getByTestId('copy-output')).toContainText('Copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(/^[0-9a-f-]{36}$/);
  }
});

test('invalid input shows a plain-language error', async ({ page }) => {
  await page.goto('/json/format');
  await fillInput(page, '{"a":1,}');
  await expect(page.getByTestId('tool-error')).toContainText('Invalid JSON');
});

test('unknown path shows not found', async ({ page }) => {
  await page.goto('/nope/nothing');
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('a new visitor gets the dark theme; light and system can be chosen and persist', async ({ page }) => {
  await page.goto('/');
  const theme = (name: string) => page.getByRole('radio', { name });
  await expect(theme('Dark')).toBeChecked();
  await theme('Light').click();
  await expect(theme('Light')).toBeChecked();
  await page.reload();
  await expect(theme('Light')).toBeChecked();
  await theme('System').click();
  await page.reload();
  await expect(theme('System')).toBeChecked();
});
