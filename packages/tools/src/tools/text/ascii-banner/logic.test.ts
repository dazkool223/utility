import { describe, expect, it } from 'vitest';
import { FONTS, renderBanner } from './logic';

describe('renderBanner', () => {
  it('draws the classic Standard font', async () => {
    expect(await renderBanner('Hi', 'Standard')).toBe(
      ['  _   _ _ ', ' | | | (_)', ' | |_| | |', ' |  _  | |', ' |_| |_|_|'].join('\n'),
    );
  });
  it('supports every bundled font', async () => {
    for (const f of FONTS) {
      const out = await renderBanner('Abc 123', f);
      expect(out.split('\n').length, f).toBeGreaterThanOrEqual(4);
    }
  });
  it('renders each line separately', async () => {
    const out = await renderBanner('a\nb', 'Small');
    expect(out.split('\n\n')).toHaveLength(2);
  });
  it('handles empty input and blank lines', async () => {
    expect(await renderBanner('', 'Standard')).toBe('');
    expect(await renderBanner('\n  \n', 'Standard')).toBe('');
  });
  it('does not crash on characters the font lacks', async () => {
    expect(typeof (await renderBanner('日本 ✓ é', 'Standard'))).toBe('string');
  });
  it('supports other layouts', async () => {
    const full = await renderBanner('ab', 'Standard', 'full');
    const fitted = await renderBanner('ab', 'Standard', 'fitted');
    expect(full.split('\n')[0]!.length).toBeGreaterThan(fitted.split('\n')[0]!.length);
  });
  it('handles a long line', async () => {
    const out = await renderBanner('x'.repeat(500), 'Small');
    expect(out.split('\n')[0]!.length).toBeGreaterThan(1000);
  });
});
