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
  await page.getByLabel('Search tools').fill('guid');
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
