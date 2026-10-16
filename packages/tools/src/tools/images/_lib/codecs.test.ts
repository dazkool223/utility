import { beforeAll, describe, expect, it } from 'vitest';
import { decodeImage, encodeImage, optimisePng, resizeImage } from './codecs';
import { sniffFormat, type RawImage } from './formats';
import { setupWasm } from './wasm-test-setup';

/** A 32x24 image: smooth gradient plus a solid red square. */
function sample(): RawImage {
  const w = 32,
    h = 24;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = Math.round((x / (w - 1)) * 255);
      data[i + 1] = Math.round((y / (h - 1)) * 255);
      data[i + 2] = 128;
      data[i + 3] = 255;
      if (x >= 4 && x < 12 && y >= 4 && y < 12) data.set([255, 0, 0, 255], i);
    }
  }
  return { data, width: w, height: h };
}

const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
const px = (img: RawImage, x: number, y: number) => Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

beforeAll(async () => {
  await setupWasm();
}, 60_000);

describe('lossless round trips keep every pixel', () => {
  for (const format of ['png', 'qoi'] as const) {
    it(format, async () => {
      const src = sample();
      const bytes = await encodeImage(src, { format });
      expect(sniffFormat(bytes)).toBe(format);
      const back = await decodeImage(buf(bytes));
      expect([back.width, back.height]).toEqual([32, 24]);
      expect(Array.from(back.data)).toEqual(Array.from(src.data));
    });
  }

  it('webp lossless', async () => {
    const src = sample();
    const bytes = await encodeImage(src, { format: 'webp', quality: 100, lossless: true });
    expect(sniffFormat(bytes)).toBe('webp');
    const back = await decodeImage(buf(bytes));
    expect(Array.from(back.data)).toEqual(Array.from(src.data));
  });

  it('jxl lossless', async () => {
    const src = sample();
    const bytes = await encodeImage(src, { format: 'jxl', quality: 100, lossless: true, effort: 3 });
    expect(sniffFormat(bytes)).toBe('jxl');
    const back = await decodeImage(buf(bytes));
    // The bundled libjxl build rounds one channel by at most 1 level in lossless mode, so allow that much.
    const worst = Math.max(...Array.from(back.data, (v, i) => Math.abs(v - src.data[i]!)));
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('avif lossless', async () => {
    const src = sample();
    const bytes = await encodeImage(src, { format: 'avif', quality: 100, lossless: true, speed: 9 });
    expect(sniffFormat(bytes)).toBe('avif');
    const back = await decodeImage(buf(bytes));
    expect([back.width, back.height]).toEqual([32, 24]);
    expect(px(back, 6, 6)).toEqual([255, 0, 0, 255]);
  }, 60_000);
});

describe('lossy formats stay close and get smaller with lower quality', () => {
  it('jpeg', async () => {
    const src = sample();
    const hi = await encodeImage(src, { format: 'jpeg', quality: 95 });
    const lo = await encodeImage(src, { format: 'jpeg', quality: 20 });
    expect(sniffFormat(hi)).toBe('jpeg');
    expect(lo.length).toBeLessThan(hi.length);
    const back = await decodeImage(buf(hi));
    const red = px(back, 6, 6);
    expect(red[0]).toBeGreaterThan(220);
    expect(red[1]).toBeLessThan(40);
    expect(red[3]).toBe(255);
  });

  it('jpeg flattens transparency onto the background colour', async () => {
    const img: RawImage = { data: new Uint8ClampedArray(16), width: 2, height: 2 };
    const white = await decodeImage(buf(await encodeImage(img, { format: 'jpeg', quality: 95 })));
    expect(px(white, 0, 0)[0]).toBeGreaterThan(245);
    const black = await decodeImage(buf(await encodeImage(img, { format: 'jpeg', quality: 95, background: [0, 0, 0] })));
    expect(px(black, 0, 0)[0]).toBeLessThan(10);
  });

  it('webp, avif and jxl decode back to the same size and a red square', async () => {
    const src = sample();
    for (const spec of [
      { format: 'webp', quality: 90 },
      { format: 'avif', quality: 80, speed: 9 },
      { format: 'jxl', quality: 90, effort: 3 },
    ] as const) {
      const bytes = await encodeImage(src, spec);
      expect(sniffFormat(bytes)).toBe(spec.format);
      const back = await decodeImage(buf(bytes));
      expect([back.width, back.height]).toEqual([32, 24]);
      const red = px(back, 6, 6);
      expect(red[0]).toBeGreaterThan(200);
      expect(red[1]).toBeLessThan(60);
    }
  }, 60_000);

  it('webp keeps alpha', async () => {
    const img: RawImage = { data: new Uint8ClampedArray([10, 20, 30, 0, 200, 100, 50, 255, 200, 100, 50, 255, 10, 20, 30, 0]), width: 2, height: 2 };
    const back = await decodeImage(buf(await encodeImage(img, { format: 'webp', quality: 100, lossless: true })));
    expect(back.data[3]).toBe(0);
    expect(back.data[7]).toBe(255);
  });
});

describe('oxipng', () => {
  it('shrinks a PNG without changing a pixel', async () => {
    const src = sample();
    const plain = await encodeImage(src, { format: 'png' });
    const small = await optimisePng(plain, 2);
    expect(small.length).toBeLessThanOrEqual(plain.length);
    expect(sniffFormat(small)).toBe('png');
    const back = await decodeImage(buf(small));
    expect(Array.from(back.data)).toEqual(Array.from(src.data));
  });

  it('is available through encodeImage as optimise', async () => {
    const bytes = await encodeImage(sample(), { format: 'png', optimise: 1 });
    expect(sniffFormat(bytes)).toBe('png');
  });
});

describe('resizeImage', () => {
  it('produces the requested size', async () => {
    const out = await resizeImage(sample(), 16, 12);
    expect([out.width, out.height]).toEqual([16, 12]);
    expect(out.data.length).toBe(16 * 12 * 4);
  });

  it('returns the same image when the size is unchanged', async () => {
    const src = sample();
    expect(await resizeImage(src, 32, 24)).toBe(src);
  });
});

describe('decodeImage errors', () => {
  it('rejects non-image bytes with a plain message', async () => {
    await expect(decodeImage(new TextEncoder().encode('hello world, this is text').buffer as ArrayBuffer)).rejects.toThrow(/not an image/);
  });

  it('rejects SVG with a pointer to the right Tool', async () => {
    await expect(decodeImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>').buffer as ArrayBuffer)).rejects.toThrow(/SVG/);
  });

  it('reports a truncated PNG instead of returning garbage', async () => {
    const full = await encodeImage(sample(), { format: 'png' });
    await expect(decodeImage(buf(full.subarray(0, 40)))).rejects.toThrow(/damaged|decode/i);
  });
});
