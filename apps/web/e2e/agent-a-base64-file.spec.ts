import { test, expect, fillInput, output } from './fixtures';

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('Base64 file tool: image to data URI with preview, and back', async ({ page }) => {
  await page.goto('/encoders/base64-file');
  await page.getByTestId('file-input').setInputFiles('e2e/fixtures/a-pixel.png');
  await expect(output(page)).toContainText('data:image/png;base64,iVBORw0KGgo');
  await expect(page.getByTestId('image-preview')).toBeVisible();

  await page.getByRole('radio', { name: 'Base64 → File' }).click();
  await fillInput(page, 'data:image/png;base64,' + PNG_B64);
  await expect(output(page)).toContainText('image/png');
  await expect(page.getByTestId('image-preview')).toBeVisible();
  await expect(page.getByTestId('tool-error')).toHaveCount(0);
});

test('Base64 file tool: invalid Base64 shows an error', async ({ page }) => {
  await page.goto('/encoders/base64-file');
  await page.getByRole('radio', { name: 'Base64 → File' }).click();
  await fillInput(page, 'not base64 !!!');
  await expect(page.getByTestId('tool-error')).toContainText('not valid Base64');
});
