import type { Page } from '@playwright/test';
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
  await expect(page.getByTestId('tool-card-pdf-merge')).toBeVisible();
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

test.describe('Category identity', () => {
  test('browse cards show the name only; the description appears on hover and on keyboard focus', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('tool-card-pdf-merge');
    await expect(card).toHaveText('Merge PDFs');
    await card.hover();
    await expect(page.getByRole('tooltip')).toContainText('Combine several PDF files');
    await page.reload();
    await card.focus();
    await expect(page.getByRole('tooltip')).toContainText('Combine several PDF files');
  });

  test('search results show the description and Category', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-search').fill('merge pdf');
    const card = page.getByTestId('tool-card-pdf-merge');
    await expect(card).toContainText('PDF');
    await expect(card).toContainText(/Merge/);
    expect((await card.innerText()).length).toBeGreaterThan('Merge PDFs'.length + 5);
  });

  test('Category headings are listed and a card still opens its Tool', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'PDF' })).toBeVisible();
    await page.getByTestId('tool-card-pdf-merge').click();
    await expect(page).toHaveURL(/\/pdf\/merge$/);
  });
});

const rail = (page: Page) => page.getByRole('navigation', { name: 'Browse Tools' });

test.describe('Persistent rail', () => {
  test('is on the home page and Tool pages, with the switch, Categories and no header search button', async ({ page }) => {
    for (const path of ['/', '/pdf/merge', '/privacy']) {
      await page.goto(path);
      await expect(rail(page)).toBeVisible();
      await expect(rail(page).getByRole('switch', { name: 'Developer tools' })).toBeVisible();
      await expect(rail(page).getByRole('link', { name: 'Images' })).toBeVisible();
      await expect(page.getByTestId('open-palette')).toHaveCount(0);
    }
    await page.goto('/');
    await expect(page.getByRole('searchbox')).toHaveCount(1);
  });

  test('Categories in the rail respect the switch', async ({ page }) => {
    await page.goto('/');
    const formats = rail(page).getByRole('link', { name: 'YAML, XML, TOML & CSV' });
    await expect(formats).toHaveCount(0);
    await rail(page).getByRole('switch', { name: 'Developer tools' }).click();
    await expect(formats).toBeVisible();
  });

  test('Favourites and Recent Tools show in the rail on a Tool page, whatever the switch says', async ({ page }) => {
    await page.goto('/json/format');
    await page.getByTestId('favourite').click();
    await page.goto('/pdf/merge');
    await expect(rail(page).getByRole('switch', { name: 'Developer tools' })).not.toBeChecked();
    await expect(page.getByTestId('rail-favourite-json-format')).toBeVisible();
    await expect(page.getByTestId('rail-recent-json-format')).toBeVisible();
    await expect(page.getByTestId('rail-recent-pdf-merge')).toBeVisible();
  });

  test('the switch and links work from the keyboard', async ({ page }) => {
    await page.goto('/');
    const toggle = rail(page).getByRole('switch', { name: 'Developer tools' });
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await rail(page).getByRole('link', { name: 'Images' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/#images$/);
  });

  test('on a narrow screen the rail collapses into a menu, and the palette shortcut still works', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto('/pdf/merge');
    await expect(rail(page)).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(rail(page)).toBeVisible();
    await expect(rail(page).getByRole('switch', { name: 'Developer tools' })).toBeVisible();
    await rail(page).getByRole('button', { name: /Find a Tool/ }).click();
    await expect(page.getByTestId('palette')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press(`${MOD}+k`);
    await expect(page.getByTestId('palette')).toBeVisible();
  });
});

const devSwitch = (page: Page) => rail(page).getByRole('switch', { name: 'Developer tools' });

test.describe('Developer tools switch', () => {
  test('is off by default: browsing hides developer Tools and developer-only Categories', async ({ page }) => {
    await page.goto('/');
    await expect(devSwitch(page)).not.toBeChecked();
    await expect(page.getByRole('heading', { name: 'Images' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'YAML, XML, TOML & CSV' })).toHaveCount(0);
    const text = page.getByRole('region', { name: 'Text' });
    await expect(text.getByTestId('tool-card-case-convert')).toBeVisible();
    await expect(text.getByTestId('tool-card-regex-tester')).toHaveCount(0);
  });

  test('turning it on reveals developer Tools after the general ones, and survives a reload as a Preference', async ({ page }) => {
    await page.goto('/');
    await devSwitch(page).click();
    await expect(page.getByRole('heading', { name: 'YAML, XML, TOML & CSV' })).toBeVisible();
    const cards = page.getByRole('region', { name: 'Text' }).locator('[data-testid^=tool-card-]');
    const ids = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('tool-card-', '')));
    expect(ids.indexOf('regex-tester')).toBeGreaterThan(ids.indexOf('line-tools'));
    await page.reload();
    await expect(devSwitch(page)).toBeChecked();
    const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('utility:preferences:v1')!));
    expect(stored.developerTools).toBe(true);
    expect(Object.keys(stored).sort()).toEqual(['developerTools', 'favourites', 'recent', 'theme']);
  });

  test('search still finds developer Tools and tags them; general Tools carry no tag', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-search').fill('jwt');
    await expect(page.getByTestId('tool-card-jwt-decode')).toContainText('Dev');
    await page.getByTestId('home-search').fill('merge pdf');
    await expect(page.getByTestId('tool-card-pdf-merge')).not.toContainText('Dev');
  });

  test('Smart Paste suggests a developer Tool for a JWT', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('smart-paste').fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    await expect(page.getByTestId('smart-jwt-decode')).toBeVisible();
  });

  test('a direct link to a developer Tool opens with the switch off', async ({ page }) => {
    await page.goto('/json/format');
    await expect(page.getByTestId('tool-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible();
  });
});
