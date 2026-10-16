import { describe, expect, it } from 'vitest';
import { createImage } from '../_lib/pixels';
import { applyTransform, ASPECTS, centredRect, coversWholeImage, describeEdit, editedName, IDENTITY, isIdentity, rotateBy, transformedSize } from './logic';

describe('rotateBy', () => {
  it('goes round in quarter turns', () => {
    expect(rotateBy(IDENTITY, 90).rotation).toBe(90);
    expect(rotateBy(rotateBy(IDENTITY, 90), 90).rotation).toBe(180);
    expect(rotateBy(IDENTITY, -90).rotation).toBe(270);
    expect(rotateBy({ ...IDENTITY, rotation: 270 }, 90).rotation).toBe(0);
  });
  it('keeps flips', () => {
    expect(rotateBy({ rotation: 0, flipH: true, flipV: false }, 90).flipH).toBe(true);
  });
});

describe('transformedSize / isIdentity', () => {
  it('swaps sides for quarter turns only', () => {
    expect(transformedSize(100, 50, { ...IDENTITY, rotation: 90 })).toEqual({ width: 50, height: 100 });
    expect(transformedSize(100, 50, { ...IDENTITY, rotation: 180 })).toEqual({ width: 100, height: 50 });
    expect(isIdentity(IDENTITY)).toBe(true);
    expect(isIdentity({ ...IDENTITY, flipV: true })).toBe(false);
  });
});

describe('applyTransform', () => {
  const img = createImage(2, 1);
  img.data.set([255, 0, 0, 255, 0, 0, 255, 255]); // red, blue
  it('flips before turning', () => {
    const flipped = applyTransform(img, { rotation: 0, flipH: true, flipV: false });
    expect([...flipped.data]).toEqual([0, 0, 255, 255, 255, 0, 0, 255]);
    const turned = applyTransform(img, { rotation: 90, flipH: false, flipV: false });
    expect([turned.width, turned.height]).toEqual([1, 2]);
    expect([...turned.data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
  });
  it('returns the same pixels for the identity', () => {
    expect(applyTransform(img, IDENTITY)).toBe(img);
  });
});

describe('centredRect', () => {
  it('is the whole picture when free', () => expect(centredRect(400, 300, null)).toEqual({ x: 0, y: 0, w: 400, h: 300 }));
  it('fits a wide ratio by height or width', () => {
    expect(centredRect(400, 300, 16 / 9)).toEqual({ x: 0, y: 38, w: 400, h: 225 });
    expect(centredRect(400, 300, 1)).toEqual({ x: 50, y: 0, w: 300, h: 300 });
  });
  it('fits a portrait ratio', () => {
    expect(centredRect(400, 300, 9 / 16)).toEqual({ x: 116, y: 0, w: 169, h: 300 });
  });
  it('has a free option and common ratios', () => {
    expect(ASPECTS[0]!.ratio).toBeNull();
    expect(ASPECTS.find((a) => a.id === '16:9')!.ratio).toBeCloseTo(1.7778, 3);
  });
});

describe('coversWholeImage / describeEdit / editedName', () => {
  it('detects a crop that changes nothing', () => {
    expect(coversWholeImage({ x: 0, y: 0, w: 10, h: 10 }, 10, 10)).toBe(true);
    expect(coversWholeImage({ x: 1, y: 0, w: 9, h: 10 }, 10, 10)).toBe(false);
    expect(coversWholeImage({ x: 0, y: 0, w: 99, h: 99 }, 10, 10)).toBe(true);
  });
  it('describes the edits', () => {
    expect(describeEdit(IDENTITY, null)).toBeNull();
    expect(describeEdit({ rotation: 90, flipH: true, flipV: false }, { x: 0, y: 0, w: 5, h: 6 })).toBe('flipped left–right, rotated 90° clockwise, cropped to 5×6');
  });
  it('names the output', () => expect(editedName('a.b.png', 'webp')).toBe('a.b-edited.webp'));
});
