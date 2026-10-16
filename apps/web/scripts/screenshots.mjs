// Visual check: screenshots of key pages in light and dark. Usage: node scripts/screenshots.mjs http://localhost:4310
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4173';
const out = 'test-results/screens';
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, colorScheme: scheme });
  await page.goto(base + '/');
  await page.screenshot({ path: `${out}/home-${scheme}.png` });
  await page.getByTestId('smart-paste').fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/smartpaste-${scheme}.png` });
  await page.goto(base + '/json/format');
  const input = page.getByTestId('tool-input').locator('.cm-content');
  await input.click();
  await input.fill('{"name":"utility","tags":["json","yaml"],"nested":{"ok":true,"n":42}}');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/tool-${scheme}.png` });
  await page.keyboard.press('Control+k');
  await page.getByTestId('palette-input').fill('base');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/palette-${scheme}.png` });
  await page.close();
}
await browser.close();
console.log('saved to', out);
