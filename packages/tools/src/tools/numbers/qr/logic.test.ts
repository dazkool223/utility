import { describe, expect, it } from 'vitest';
import { DEFAULT_QR, dataUrlToBlob, qrMatrix, qrPngDataUrl, qrSvg } from './logic';

describe('qrMatrix', () => {
  it('"HELLO WORLD" at Q is version 1 (21 modules), as in ISO 18004', async () => {
    expect(await qrMatrix('HELLO WORLD', 'Q')).toEqual({ size: 21, version: 1 });
  });
  it('higher error correction needs a bigger symbol', async () => {
    const l = await qrMatrix('https://example.com/some/longer/path?query=1', 'L');
    const h = await qrMatrix('https://example.com/some/longer/path?query=1', 'H');
    expect(h.version).toBeGreaterThan(l.version);
  });
  it('rejects data that cannot fit', async () => {
    await expect(qrMatrix('x'.repeat(5000), 'L')).rejects.toThrow(/too long/);
  });
});

describe('qrSvg / qrPngDataUrl', () => {
  it('produces SVG with the chosen colours', async () => {
    const svg = await qrSvg('hello', { ...DEFAULT_QR, dark: '#112233', light: '#ffeedd' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('#112233');
    expect(svg).toContain('#ffeedd');
  });
  it('produces a valid PNG (signature check)', async () => {
    const blob = dataUrlToBlob(await qrPngDataUrl('hello'));
    expect(blob.type).toBe('image/png');
    const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    expect(Array.from(head)).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
  it('handles unicode text', async () => {
    expect(await qrSvg('héllo ✓ 你好')).toContain('<svg');
  });
  it('validates options', async () => {
    await expect(qrSvg('')).rejects.toThrow(/Enter the text/);
    await expect(qrSvg('x', { ...DEFAULT_QR, size: 10 })).rejects.toThrow(/Size/);
    await expect(qrSvg('x', { ...DEFAULT_QR, margin: -1 })).rejects.toThrow(/Margin/);
    await expect(qrSvg('x', { ...DEFAULT_QR, dark: 'red' })).rejects.toThrow(/Colours/);
  });
});
