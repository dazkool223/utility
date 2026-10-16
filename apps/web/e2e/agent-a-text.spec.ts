import { test, expect, fillInput, output } from './fixtures';

test('Regex tester stops a catastrophic pattern and stays usable', async ({ page }) => {
  await page.goto('/text/regex');
  await page.getByTestId('regex-pattern').fill('(a+)+$');
  await fillInput(page, 'a'.repeat(40) + 'b');
  await expect(page.getByTestId('tool-error')).toContainText('took longer', { timeout: 15_000 });
  // The page still responds, and a sane pattern works afterwards.
  await page.getByTestId('regex-pattern').fill('a+');
  await expect(output(page)).toContainText('0-40', { timeout: 15_000 });
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
});

test('Regex tester shows groups and replacements', async ({ page }) => {
  await page.goto('/text/regex');
  await page.getByTestId('regex-pattern').fill('(?<k>[a-z]+)=([0-9]+)');
  await page.getByTestId('regex-replacement').fill('$2:$<k>');
  await fillInput(page, 'a=1 b=22');
  await expect(output(page)).toContainText('k: a');
  await expect(page.getByTestId('regex-replaced')).toHaveText('1:a 22:b');
});

test('Regex tester reports an invalid pattern', async ({ page }) => {
  await page.goto('/text/regex');
  await page.getByTestId('regex-pattern').fill('(');
  await fillInput(page, 'x');
  await expect(page.getByTestId('tool-error')).toContainText('Invalid regular expression');
});

test('Text diff highlights changes in both layouts', async ({ page }) => {
  await page.goto('/text/diff');
  await fillInput(page, 'one\ntwo\nthree');
  await page.getByTestId('tool-input-2').locator('.cm-content').fill('one\n2\nthree\nfour');
  await expect(page.getByTestId('diff-summary')).toContainText('2 lines added, 1 lines removed');
  await page.getByRole('radio', { name: 'Side by side' }).click();
  await expect(output(page)).toContainText('four');
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
});

test('List comparer computes set operations', async ({ page }) => {
  await page.goto('/text/list-compare');
  await fillInput(page, 'a\nb\nc');
  await page.getByTestId('tool-input-2').locator('.cm-content').fill('b\nc\nd');
  await page.getByLabel('Show').selectOption('intersection');
  await expect(output(page)).toContainText('Result: 2');
});

test('ASCII banner draws letters offline', async ({ page }) => {
  await page.goto('/text/ascii-banner');
  await fillInput(page, 'OK');
  await expect(output(page)).toContainText('___');
  await page.getByLabel('Font').selectOption('Slant');
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
});
