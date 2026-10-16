import type { Page, Route } from '@playwright/test';
import { test, expect, fillInput, listTools, output } from './fixtures';

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
  await expect(page.getByTestId('home-search')).toBeFocused(); // the app is ready for keyboard shortcuts
  await page.keyboard.press(`${MOD}+k`);
  await expect(page.getByTestId('palette')).toBeVisible();
  await page.getByTestId('palette-input').fill('json formatter');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/json\/format$/);
  await expect(page.getByTestId('palette')).toHaveCount(0);
});

test('palette Smart Paste opens the Tool with the pasted data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-search')).toBeFocused();
  await page.keyboard.press(`${MOD}+k`);
  await page.getByTestId('palette-input').fill('{"pasted":true}');
  await page.getByText('Open in JSON Formatter').click();
  await expect(page).toHaveURL(/\/json\/format$/);
  await expect(output(page)).toContainText('"pasted": true');
});

test('home Smart Paste suggests Tools for pasted text', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('home-search').fill('SGVsbG8sIHdvcmxkIQ==');
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

test('unknown path shows a kind not-found page with a way back', async ({ page }) => {
  await page.goto('/nope/nothing');
  await expect(page.getByRole('heading', { name: "We can't find that page" })).toBeVisible();
  await page.getByRole('link', { name: 'Take me home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('home-search')).toBeVisible();
});

test('a Tool that fails to load shows kind wording and can be reloaded', async ({ page, browserName }) => {
  // WebKit keeps serving the failed module fetch after a reload while the request is intercepted, so recovery cannot be simulated there.
  test.skip(browserName === 'webkit', 'WebKit remembers an aborted module fetch across a reload');
  // Block the Tool's code so loading it fails, as a flaky network or a stale cache would.
  const toolChunks = /\/assets\/Tool-[^/]*\.js$/;
  let blocked = true;
  await page.route(toolChunks, (route: Route) => (blocked ? route.abort() : route.continue()));
  await page.goto('/json/format');
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Sorry, this Tool ran into a problem');
  await expect(alert.getByRole('button', { name: 'Reload Tool' })).toBeVisible();
  blocked = false;
  await alert.getByRole('button', { name: 'Reload Tool' }).click();
  await expect(page.getByTestId('tool-input')).toBeVisible({ timeout: 15_000 });
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

test.describe('Home bench', () => {
  test('opens with the search field focused and no greeting', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a Tool');
    await expect(page.getByTestId('home-search')).toBeFocused();
  });

  test('search shows the matched Alias and the Category', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-search').fill('b64');
    const card = page.getByTestId('tool-card-base64-text');
    await expect(card).toContainText('b64 →');
    await expect(card).toContainText('Encoders & Decoders');
  });

  test('Enter on a short search opens the best match', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-search').fill('json formatter');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/json\/format$/);
  });

  test('Smart Paste stays visible while typing, and lists the best match first', async ({ page }) => {
    await page.goto('/');
    const smart = page.getByTestId('smart-paste-result');
    await expect(smart).toBeVisible();
    await page.getByTestId('home-search').fill('pdf');
    await expect(smart).toBeVisible();
    await page.getByTestId('home-search').fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    await expect(smart.getByRole('button').first()).toHaveAttribute('data-testid', 'smart-jwt-decode');
    await smart.getByRole('button').first().click();
    await expect(output(page)).toContainText('1234567890');
  });

  test('pasting anywhere on the page runs Smart Paste without focusing the bar first', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-search').blur();
    await expect(page.getByTestId('home-search')).not.toBeFocused();
    await page.evaluate((text) => {
      const data = new DataTransfer();
      data.setData('text/plain', text);
      const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: data }); // Firefox ignores clipboardData in the constructor
      document.body.dispatchEvent(event);
    }, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    await expect(page.getByTestId('smart-paste-result').getByRole('button').first()).toHaveAttribute('data-testid', 'smart-jwt-decode');
    await expect(page.getByTestId('home-search')).toBeFocused();
  });

  test('empty Favourites, empty Recent and no-match states have friendly copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Favourites' })).toContainText('Nothing pinned yet');
    await expect(page.getByRole('region', { name: 'Recent' })).toContainText('Tools you open will show up here');
    await page.getByTestId('home-search').fill('zzzqqqxxx');
    await expect(page.getByText(/Nothing called/)).toBeVisible();
  });
});

test.describe('Tool page', () => {
  test('header shows the name, description and breadcrumb, with an icon-only Favourite control', async ({ page }) => {
    await page.goto('/json/format');
    await expect(page.getByRole('heading', { level: 1, name: 'JSON Formatter' })).toBeVisible();
    await expect(page.getByTestId('tool-page').getByText('Pretty-print and validate JSON')).toBeVisible();
    const star = page.getByRole('button', { name: 'Add to favourites' });
    await expect(star).toHaveText('');
    await star.click();
    await expect(page.getByRole('button', { name: 'Remove from favourites' })).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Remove from favourites' })).toBeVisible();
  });

  test('"Works well with" lists related Tools and opens one', async ({ page }) => {
    await page.goto('/json/format');
    await page.getByLabel('Works well with').selectOption({ index: 1 });
    await expect(page).not.toHaveURL(/\/json\/format$/);
    await expect(page.getByTestId('tool-page')).toBeVisible();
  });

  test('panes use the available width and height on a large screen, and stack on a small one', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/json/format');
    const input = (await page.getByTestId('tool-input').boundingBox())!;
    const out = (await page.getByTestId('tool-output').boundingBox())!;
    expect(input.height).toBeGreaterThan(350);
    expect(input.width).toBeGreaterThan(400);
    expect(out.x).toBeGreaterThan(input.x + input.width - 2);
    await page.setViewportSize({ width: 600, height: 900 });
    const inSmall = (await page.getByTestId('tool-input').boundingBox())!;
    const outSmall = (await page.getByTestId('tool-output').boundingBox())!;
    expect(outSmall.y).toBeGreaterThan(inSmall.y + inSmall.height - 2);
  });

  test('Restrictions are shown before the user starts, and the Tool still works', async ({ page }) => {
    await page.goto('/images/convert');
    await expect(page.getByTestId('restrictions')).toBeVisible();
    await expect(page.getByTestId('file-input')).toBeAttached();
  });

  test('a Heavy Tool explains its first-use download once, in the header', async ({ page }) => {
    await page.goto('/pdf/ocr');
    await expect(page.getByText(/Downloads its engine the first time/)).toHaveCount(1);
    await page.goto('/json/format');
    await expect(page.getByText(/Downloads its engine/)).toHaveCount(0);
  });
});

test.describe('Privacy chip', () => {
  test('the privacy message appears once, as the rail chip, on every kind of page', async ({ page }) => {
    for (const path of ['/', '/category/images', '/a-z', '/pdf/merge', '/images/convert', '/privacy']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByTestId('privacy-chip')).toHaveCount(1);
      await expect(page.getByTestId('privacy-chip')).toBeVisible();
      await expect(page.getByText('Private, works offline')).toHaveCount(1);
      if (path === '/privacy') continue;
      await expect(page.getByText(/Nothing you enter leaves/)).toHaveCount(0);
      await expect(page.getByText(/100% in your browser/)).toHaveCount(0);
      await expect(page.getByText(/Everything runs in your browser/)).toHaveCount(0);
      await expect(page.getByText(/Files stay on your device/)).toHaveCount(0);
    }
  });

  test('the chip opens a short explanation with a link to the Privacy page, by keyboard too', async ({ page }) => {
    await page.goto('/pdf/merge');
    const chip = page.getByTestId('privacy-chip');
    await chip.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Nothing you enter leaves it/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Nothing you enter leaves it/)).toHaveCount(0);
    await chip.click();
    await page.getByRole('link', { name: 'How we guarantee it' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nothing leaves your browser');
  });

  test('the chip changes only on a real problem: offline with a Heavy Tool engine that is not cached', async ({ page, context }) => {
    await page.goto('/pdf/ocr');
    await expect(page.getByTestId('privacy-chip')).toHaveText('Private, works offline');
    await context.setOffline(true);
    await expect(page.getByTestId('privacy-chip')).toHaveText('Needs a connection');
    await context.setOffline(false);
    await expect(page.getByTestId('privacy-chip')).toHaveText('Private, works offline');
  });
});

test.describe('Quality pass', () => {
  test('after the first visit the app, its Tools and its fonts work offline', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload(); // from here on the page is controlled by the service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a Tool');
    const faces = await page.evaluate(async () => {
      const loaded = await Promise.all([document.fonts.load('16px "Figtree Variable"'), document.fonts.load('600 24px "Fraunces Variable"'), document.fonts.load('14px "JetBrains Mono Variable"')]);
      return loaded.map((l) => l.length);
    });
    expect(faces.every((n) => n > 0)).toBe(true);
    await page.getByTestId('tool-card-pdf-merge').click();
    await expect(page.getByTestId('tool-page')).toBeVisible();
    await expect(page.getByTestId('file-input')).toBeAttached();
    await context.setOffline(false);
  });

  test('landmarks are in place and the skip link and rail come before the page content in the tab order', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari/WebKit does not Tab to links unless the system setting is on');
    await page.goto('/pdf/merge');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Browse Tools' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    const order: string[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => (() => { const el = document.activeElement as HTMLButtonElement | null; return (el?.getAttribute('aria-label') ?? el?.labels?.[0]?.textContent ?? el?.textContent ?? '').trim(); })()));
    }
    expect(order.indexOf('Developer tools')).toBeGreaterThan(-1);
    expect(order.some((n) => /^Works well with|^Add to favourites/.test(n))).toBe(false); // the page content comes after the rail
    await page.getByRole('link', { name: 'Skip to content' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

const cardIds = (page: Page) =>
  page.locator('[data-testid^=tool-card-]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('tool-card-', '')));

test.describe('Category view and A-Z index', () => {
  test('a Category in the rail opens a name-only grid that respects the switch, general Tools first', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Browse Tools' }).getByRole('link', { name: 'Text', exact: true }).click();
    await expect(page).toHaveURL(/\/category\/text$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Text' })).toBeVisible();
    await expect(page.getByTestId('tool-card-case-convert')).toHaveText('Case Converter');
    await expect(page.getByTestId('tool-card-regex-tester')).toHaveCount(0);
    await page.getByRole('switch', { name: 'Developer tools' }).click();
    const ids = await cardIds(page);
    expect(ids).toContain('regex-tester');
    expect(ids.indexOf('regex-tester')).toBeGreaterThan(ids.indexOf('line-tools'));
  });

  test('the breadcrumb on a Tool page links to its Category view', async ({ page }) => {
    await page.goto('/pdf/merge');
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'PDF' }).click();
    await expect(page).toHaveURL(/\/category\/pdf$/);
    await expect(page.getByTestId('tool-card-pdf-merge')).toBeVisible();
  });

  test('a link to a developer-only Category opens and offers to reveal its Tools', async ({ page }) => {
    await page.goto('/category/formats');
    await page.getByRole('button', { name: 'Show developer Tools' }).click();
    await expect(page.getByTestId('tool-card-toml-json')).toBeVisible();
  });

  test('the A-Z index is reachable from the rail, alphabetical, and respects the switch', async ({ page }) => {
    const all = await listTools(page);
    await page.getByRole('navigation', { name: 'Browse Tools' }).getByRole('link', { name: 'A–Z index' }).click();
    await expect(page).toHaveURL(/\/a-z$/);
    const off = await cardIds(page);
    expect(off.length).toBeGreaterThan(0);
    expect(off.length).toBeLessThan(all.length);
    expect(off).not.toContain('jwt-decode');
    await page.getByRole('switch', { name: 'Developer tools' }).click();
    const on = await cardIds(page);
    expect(on).toHaveLength(all.length);
    const names = new Map(all.map((t) => [t.id, t.name]));
    const sorted = on.map((id) => names.get(id)!);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  });
});

const rail = (page: Page) => page.getByRole('navigation', { name: 'Browse Tools' });

test.describe('Persistent rail', () => {
  test('is on the home page and Tool pages, with the switch, Categories and no header search button', async ({ page }) => {
    for (const path of ['/', '/pdf/merge', '/privacy']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(rail(page)).toBeVisible();
      await expect(rail(page).getByRole('switch', { name: 'Developer tools' })).toBeVisible();
      await expect(rail(page).getByRole('link', { name: 'Images' })).toBeVisible();
      await expect(page.getByTestId('open-palette')).toHaveCount(0);
    }
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: /Search Tools/ })).toHaveCount(1);
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
    await expect(page).toHaveURL(/\/category\/images$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Images' })).toBeVisible();
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
    await page.getByTestId('home-search').fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    await expect(page.getByTestId('smart-jwt-decode')).toBeVisible();
  });

  test('a direct link to a developer Tool opens with the switch off', async ({ page }) => {
    await page.goto('/json/format');
    await expect(page.getByTestId('tool-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible();
  });
});
