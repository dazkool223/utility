import { expose } from 'comlink';
import { ToolError } from '@/core/types';
import type { EncodeSpec } from '../_lib/codecs';
import type { RawImage } from '../_lib/formats';
import { cropImage, type Rect } from '../_lib/pixels';
import { createSession, encodeResult, makePreview } from '../_lib/session';
import { applyTransform, type Transform } from './logic';

const session = createSession();

/** The turned/flipped picture is kept so dragging the crop box does not redo the work. */
let cached: { key: string; image: RawImage } | null = null;

function transformed(t: Transform): RawImage {
  const key = `${t.rotation}|${t.flipH}|${t.flipV}`;
  if (cached?.key !== key) cached = { key, image: applyTransform(session.image(), t) };
  return cached.image;
}

export const api = {
  async load(buf: ArrayBuffer) {
    cached = null;
    return session.load(buf);
  },
  /** A screen-sized PNG of the picture after turning and flipping, plus its full size. */
  preview(t: Transform, maxEdge: number) {
    return makePreview(transformed(t), maxEdge);
  },
  async save(t: Transform, crop: Rect | null, spec: EncodeSpec) {
    let image = transformed(t);
    if (crop) {
      try {
        image = cropImage(image, crop);
      } catch {
        throw new ToolError('The crop area is empty or outside the picture. Draw it again.');
      }
    }
    return encodeResult(image, spec);
  },
  clear() {
    cached = null;
    session.clear();
  },
};

expose(api);
