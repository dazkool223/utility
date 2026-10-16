import { test as base, expect, type Page } from '@playwright/test';

/**
 * Every E2E test runs behind this guard (spec §3.3, ADR 0001):
 * - any request to an origin other than the app's own fails the test;
 * - any Content-Security-Policy violation fails the test;
 * - uncaught page errors fail the test.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const origin = new URL(baseURL!).origin;
      const problems: string[] = [];
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url.startsWith('blob:')) return;
        if (new URL(url).origin !== origin) problems.push(`Network request to another origin: ${url}`);
      });
      page.on('console', (msg) => {
        const text = msg.text();
        if (/Content[- ]Security[- ]Policy|Refused to (connect|load|execute|frame)/i.test(text)) problems.push(`CSP violation: ${text}`);
      });
      page.on('pageerror', (err) => problems.push(`Uncaught error: ${err.message}`));
      await use();
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export interface ToolInfo {
  id: string;
  path: string;
  name: string;
  inputKind: string;
  heavy: boolean;
  example?: { input: string; expect: string };
}

export async function listTools(page: Page): Promise<ToolInfo[]> {
  await page.goto('/');
  return page.evaluate(() => (window as unknown as { __UTILITY_TOOLS__: ToolInfo[] }).__UTILITY_TOOLS__);
}

/** Type into the CodeMirror Tool Input. */
export async function fillInput(page: Page, text: string) {
  const content = page.getByTestId('tool-input').locator('.cm-content');
  await content.click();
  await content.fill(text);
}

export function output(page: Page) {
  return page.getByTestId('tool-output');
}
