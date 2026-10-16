import { test as base, expect, chromium, type BrowserContext } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const extensionPath = fileURLToPath(new URL('../dist/chrome', import.meta.url));

const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    // Zero-network guard: the extension must never reach another origin.
    const problems: string[] = [];
    context.on('request', (req) => {
      const url = req.url();
      if (!/^(chrome-extension|data|blob):/.test(url)) problems.push(`Network request: ${url}`);
    });
    context.on('weberror', (e) => problems.push(`Uncaught error: ${e.error().message}`));
    await use(context);
    await context.close();
    expect(problems, problems.join('\n')).toEqual([]);
  },
  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    await use(new URL(worker.url()).host);
  },
});

test('background worker starts and the manifest is minimal', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/manifest.json`);
  const manifest = JSON.parse(await page.locator('body').innerText());
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions.sort()).toEqual(['contextMenus', 'storage']);
  expect(manifest.host_permissions).toBeUndefined();
  expect(manifest.content_security_policy.extension_pages).toContain("connect-src 'self'");
});

test('Quick Launcher runs a Tool inline in the popup', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByRole('button', { name: /JSON Formatter/ }).click();
  const input = page.getByTestId('tool-input').locator('.cm-content');
  await input.click();
  await input.fill('{"from":"popup"}');
  await expect(page.getByTestId('tool-output')).toContainText('"from": "popup"');
});

test('popup search falls back to all Tools', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByLabel('Search Tools, or paste anything').fill('guid');
  await expect(page.getByRole('button', { name: /UUID Generator/ })).toBeVisible();
});

test('full catalog works with hash routing', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/app.html`);
  await page.getByTestId('tool-card-base64-text').click();
  await expect(page).toHaveURL(/#\/encoders\/base64$/);
  const input = page.getByTestId('tool-input').locator('.cm-content');
  await input.click();
  await input.fill('hi');
  await expect(page.getByTestId('tool-output')).toContainText('aGk=');
});

test('context-menu handover opens the Tool with the selection, then forgets it', async ({ context, extensionId }) => {
  const [worker] = context.serviceWorkers();
  // Simulate the context-menu click path: the background stores the selection in session storage and opens the tab.
  await worker!.evaluate(async () => {
    await chrome.storage.session.set({ 'pending-input': { toolId: 'json-format', input: '{"selected":1}' } });
  });
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/app.html#/json/format`);
  await expect(page.getByTestId('tool-output')).toContainText('"selected": 1');
  const left = await worker!.evaluate(() => chrome.storage.session.get('pending-input'));
  expect(left).toEqual({});
});

test('the Developer tools switch is on by default in the Extension', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/app.html`);
  await expect(page.getByRole('switch', { name: 'Developer tools' })).toBeChecked();
  await expect(page.getByTestId('tool-card-json-format')).toBeVisible();
});

test('Quick Launcher is a single compact column: search, Smart Paste, no rail, Developer tools on by default', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByLabel('Search Tools, or paste anything')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Browse Tools' })).toHaveCount(0);
  await expect(page.getByRole('switch', { name: 'Developer tools' })).toBeChecked();
});

test('a stored Developer tools choice wins over the Extension default', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByRole('switch', { name: 'Developer tools' }).click();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Developer tools' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: /JSON Formatter/ })).toHaveCount(0);
  await page.getByLabel('Search Tools, or paste anything').fill('json formatter');
  await expect(page.getByRole('button', { name: /JSON Formatter/ })).toBeVisible();
});

test('Smart Paste in the popup suggests Tools and carries the pasted text into the Tool', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByLabel('Search Tools, or paste anything').fill('{"pasted":true}');
  await expect(page.getByTestId('smart-paste-result')).toContainText('JSON');
  await page.getByTestId('smart-paste-result').getByRole('button', { name: 'JSON Formatter' }).click();
  await expect(page.getByTestId('tool-output')).toContainText('"pasted": true');
});

test('Favourites and Recent Tools show in the popup', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.evaluate(() => localStorage.setItem('utility:preferences:v1', JSON.stringify({ theme: 'dark', favourites: ['json-format'], recent: ['base64-text'] })));
  await page.reload();
  await expect(page.getByRole('region', { name: 'Favourites' }).getByRole('button', { name: /JSON Formatter/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recent' }).getByRole('button', { name: /Base64/ })).toBeVisible();
});

test('a Heavy Tool opened from the popup links out to the Website', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByLabel('Search Tools, or paste anything').fill('ocr');
  const row = page.getByRole('button', { name: /OCR/ });
  await expect(row).toContainText('on the website');
  const [tab] = await Promise.all([context.waitForEvent('page'), row.click()]);
  await expect(tab.getByTestId('heavy-link-out')).toBeVisible();
  await expect(tab.getByTestId('heavy-link-out').getByRole('link')).toHaveAttribute('href', /\/pdf\/ocr$/);
});
