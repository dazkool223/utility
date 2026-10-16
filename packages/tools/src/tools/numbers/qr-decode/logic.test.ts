import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { classifyPayload, decodeQrPixels } from './logic';

/** Rasterises a QR code into RGBA pixels (scale px per module, 4-module quiet zone). */
function render(text: string, scale = 6, invert = false): { data: Uint8ClampedArray; w: number; h: number } {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = q.modules.size;
  const w = (n + 8) * scale;
  const data = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const mx = Math.floor(x / scale) - 4;
      const my = Math.floor(y / scale) - 4;
      const dark = mx >= 0 && my >= 0 && mx < n && my < n && q.modules.get(my, mx) === 1;
      const v = dark !== invert ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, w, h: w };
}

describe('decodeQrPixels', () => {
  it('round-trips text, links and unicode', async () => {
    for (const text of ['hello', 'https://example.com/path?q=1&r=2', 'héllo ✓ 你好', '0123456789'.repeat(20)]) {
      const img = render(text);
      const r = await decodeQrPixels(img.data, img.w, img.h);
      expect(r?.text).toBe(text);
    }
  });
  it('reads inverted (light on dark) codes', async () => {
    const img = render('inverted', 6, true);
    expect((await decodeQrPixels(img.data, img.w, img.h))?.text).toBe('inverted');
  });
  it('returns null when there is no code', async () => {
    const blank = new Uint8ClampedArray(100 * 100 * 4).fill(255);
    expect(await decodeQrPixels(blank, 100, 100)).toBeNull();
  });
  it('classifies payloads', async () => {
    const img = render('https://example.com');
    expect((await decodeQrPixels(img.data, img.w, img.h))?.kind).toBe('Web link');
    expect(classifyPayload('WIFI:S:net;T:WPA;P:pw;;')).toBe('Wi-Fi network');
    expect(classifyPayload('otpauth://totp/x?secret=ABC')).toContain('2FA');
    expect(classifyPayload('plain')).toBe('Text');
  });
  it('rejects tiny or inconsistent images', async () => {
    await expect(decodeQrPixels(new Uint8ClampedArray(16), 2, 2)).rejects.toThrow(/too small/);
    await expect(decodeQrPixels(new Uint8ClampedArray(10), 30, 30)).rejects.toThrow(/damaged/);
  });
});
