import { describe, expect, it } from 'vitest';
import { clampRect, cloneImage, createImage, cropImage, fillRectInPlace, fitWithin, flipImage, pixelateInPlace, rectFromDrag, rotateImage } from './pixels';
import type { RawImage } from './formats';

/** 3x2 image whose pixels are numbered 1..6 in the red channel. */
function numbered(): RawImage {
  const img = createImage(3, 2);
  for (let i = 0; i < 6; i++) img.data.set([i + 1, 0, 0, 255], i * 4);
  return img;
}
const reds = (img: RawImage) => Array.from({ length: img.width * img.height }, (_, i) => img.data[i * 4]);

describe('rotateImage', () => {
  it('rotates 90 degrees clockwise', () => {
    // 1 2 3      4 1
    // 4 5 6  ->  5 2
    //            6 3
    const out = rotateImage(numbered(), 90);
    expect([out.width, out.height]).toEqual([2, 3]);
    expect(reds(out)).toEqual([4, 1, 5, 2, 6, 3]);
  });

  it('rotates 180 and 270 degrees', () => {
    expect(reds(rotateImage(numbered(), 180))).toEqual([6, 5, 4, 3, 2, 1]);
    const out = rotateImage(numbered(), 270);
    expect([out.width, out.height]).toEqual([2, 3]);
    expect(reds(out)).toEqual([3, 6, 2, 5, 1, 4]);
  });

  it('is the identity at 0 and returns to the start after four quarter turns', () => {
    const src = numbered();
    expect(rotateImage(src, 0)).toBe(src);
    let r = src;
    for (let i = 0; i < 4; i++) r = rotateImage(r, 90);
    expect(reds(r)).toEqual(reds(src));
  });
});

describe('flipImage', () => {
  it('flips horizontally and vertically', () => {
    expect(reds(flipImage(numbered(), true, false))).toEqual([3, 2, 1, 6, 5, 4]);
    expect(reds(flipImage(numbered(), false, true))).toEqual([4, 5, 6, 1, 2, 3]);
    expect(reds(flipImage(numbered(), true, true))).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('returns the same image when nothing is flipped', () => {
    const src = numbered();
    expect(flipImage(src, false, false)).toBe(src);
  });
});

describe('cropImage and clampRect', () => {
  it('crops a region', () => {
    const out = cropImage(numbered(), { x: 1, y: 0, w: 2, h: 2 });
    expect([out.width, out.height]).toEqual([2, 2]);
    expect(reds(out)).toEqual([2, 3, 5, 6]);
  });

  it('clamps a region that sticks out of the image', () => {
    expect(clampRect({ x: -5, y: -5, w: 100, h: 100 }, 3, 2)).toEqual({ x: 0, y: 0, w: 3, h: 2 });
    expect(clampRect({ x: 2.4, y: 0.6, w: 5, h: 5 }, 3, 2)).toEqual({ x: 2, y: 1, w: 1, h: 1 });
  });

  it('rejects an empty or outside region', () => {
    expect(clampRect({ x: 5, y: 5, w: 2, h: 2 }, 3, 2)).toBeNull();
    expect(clampRect({ x: 0, y: 0, w: 0, h: 2 }, 3, 2)).toBeNull();
    expect(() => cropImage(numbered(), { x: 10, y: 10, w: 1, h: 1 })).toThrow(/empty or outside/);
  });
});

describe('pixelateInPlace', () => {
  it('replaces each block with its average and leaves the rest alone', () => {
    const img = createImage(4, 2);
    // left half: 0 and 100; right half: 200 and 40
    for (const [x, v] of [[0, 0], [1, 100], [2, 200], [3, 40]] as const) {
      for (let y = 0; y < 2; y++) img.data.set([v, v, v, 255], (y * 4 + x) * 4);
    }
    pixelateInPlace(img, { x: 0, y: 0, w: 2, h: 2 }, 2);
    expect(img.data[0]).toBe(50);
    expect(img.data[4]).toBe(50);
    expect(img.data[(1 * 4 + 1) * 4]).toBe(50);
    expect(img.data[8]).toBe(200);
    expect(img.data[12]).toBe(40);
  });

  it('handles blocks that do not divide the region evenly', () => {
    const img = createImage(5, 1);
    for (let x = 0; x < 5; x++) img.data.set([x * 10, 0, 0, 255], x * 4);
    pixelateInPlace(img, { x: 0, y: 0, w: 5, h: 1 }, 3);
    expect(reds(img)).toEqual([10, 10, 10, 35, 35]);
  });

  it('does nothing for an empty region or a zero block size', () => {
    const img = numbered();
    const before = cloneImage(img);
    pixelateInPlace(img, { x: 9, y: 9, w: 3, h: 3 }, 4);
    pixelateInPlace(img, { x: 0, y: 0, w: 3, h: 2 }, 0);
    expect(reds(img)).toEqual(reds(before));
  });
});

describe('fillRectInPlace', () => {
  it('paints an opaque block and nothing else', () => {
    const img = numbered();
    fillRectInPlace(img, { x: 1, y: 0, w: 1, h: 2 }, [9, 8, 7]);
    expect(Array.from(img.data.subarray(4, 8))).toEqual([9, 8, 7, 255]);
    expect(img.data[0]).toBe(1);
  });
});

describe('fitWithin', () => {
  it('scales down to the longest edge and never up', () => {
    expect(fitWithin(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 });
    expect(fitWithin(200, 100, 1000)).toEqual({ width: 200, height: 100 });
    expect(fitWithin(1, 5000, 100)).toEqual({ width: 1, height: 100 });
  });
});

describe('rectFromDrag', () => {
  it('builds a rectangle from any drag direction', () => {
    expect(rectFromDrag({ x: 50, y: 40 }, { x: 10, y: 10 }, 100, 80)).toEqual({ x: 10, y: 10, w: 40, h: 30 });
  });

  it('clamps to the image', () => {
    expect(rectFromDrag({ x: 90, y: 70 }, { x: 150, y: 120 }, 100, 80)).toEqual({ x: 90, y: 70, w: 10, h: 10 });
  });

  it('locks the aspect ratio', () => {
    const r = rectFromDrag({ x: 0, y: 0 }, { x: 60, y: 60 }, 100, 100, 2)!;
    expect(r.w / r.h).toBeCloseTo(2, 1);
    expect(r.w).toBe(60);
  });

  it('keeps a locked ratio inside the image', () => {
    const r = rectFromDrag({ x: 80, y: 0 }, { x: 200, y: 10 }, 100, 100, 1)!;
    expect(r.x + r.w).toBeLessThanOrEqual(100);
    expect(r.w).toBe(r.h);
  });

  it('returns null for a click without a drag', () => {
    expect(rectFromDrag({ x: 5, y: 5 }, { x: 5, y: 5 }, 100, 100)).toBeNull();
  });
});
