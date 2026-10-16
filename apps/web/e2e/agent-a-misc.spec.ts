import { test, expect, fillInput, output } from './fixtures';

test('Stopwatch starts, laps, pauses and resets', async ({ page }) => {
  await page.goto('/time/stopwatch');
  await page.getByTestId('stopwatch-toggle').click();
  await page.waitForTimeout(400);
  await page.getByTestId('stopwatch-lap').click();
  await page.getByTestId('stopwatch-toggle').click();
  await expect(output(page)).not.toHaveText('00:00.000');
  await expect(page.getByTestId('stopwatch-laps')).toBeVisible();
  await page.getByTestId('stopwatch-reset').click();
  await expect(page.getByTestId('stopwatch-laps')).toHaveCount(0);
});

test('Markdown preview strips scripts and event handlers', async ({ page }) => {
  await page.goto('/code/markdown-preview');
  await fillInput(page, '# Title\n\n<img src=x onerror="document.title=\'pwned\'">\n\n<script>document.title="pwned"</script>');
  await expect(output(page)).toContainText('Title');
  await page.waitForTimeout(500);
  expect(await page.title()).not.toContain('pwned');
  await expect(output(page).locator('script')).toHaveCount(0);
});

test('Cron parser lists next runs and switches dialect', async ({ page }) => {
  await page.goto('/time/cron');
  await fillInput(page, '0 9 * * MON-FRI');
  await expect(output(page)).toContainText('Monday through Friday');
  await expect(output(page).locator('li')).toHaveCount(10);
  await page.getByLabel('Cron dialect').selectOption('quartz');
  await expect(page.getByTestId('tool-error')).toContainText('Quartz');
});

test('JSON tree shows nested values and copies a path', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
  await page.goto('/json/tree');
  await fillInput(page, '{"a":{"b":[1,2]}}');
  await expect(output(page)).toContainText('b');
  await page.getByRole('button', { name: 'Expand all' }).click();
  await expect(output(page)).toContainText('0');
});
