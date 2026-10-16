import { test, expect, listTools, fillInput, output } from './fixtures';

/**
 * Generic check for every Tool that declares an `example` in its meta.ts:
 * the page loads, the example input produces output containing the expected text, and no error is shown.
 * File-based Tools have their own spec files.
 */
test('every Tool with an example produces the expected output', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const tools = (await listTools(page)).filter((t) => t.example);
  expect(tools.length).toBeGreaterThan(0);
  for (const tool of tools) {
    await test.step(tool.id, async () => {
      await page.goto(`/${tool.path}`);
      await expect(page.getByTestId('tool-page')).toHaveAttribute('data-tool-id', tool.id);
      if (tool.example!.input) await fillInput(page, tool.example!.input);
      await expect.soft(output(page), `${tool.id}: output`).toContainText(tool.example!.expect, { timeout: 15_000 });
      await expect.soft(page.getByTestId('tool-error'), `${tool.id}: no error`).toHaveCount(0);
    });
  }
});
