import { expose } from 'comlink';
import { resizeImage, type EncodeSpec } from '../_lib/codecs';
import { fitWithin } from '../_lib/pixels';
import { createSession, encodeResult } from '../_lib/session';

const session = createSession();

export const api = {
  load: (buf: ArrayBuffer) => session.load(buf),
  /** Encode the loaded picture, first shrinking it so its longest side is at most `maxEdge` (null keeps the size). */
  async compress(spec: EncodeSpec, maxEdge: number | null) {
    let image = session.image();
    if (maxEdge !== null && Math.max(image.width, image.height) > maxEdge) {
      const { width, height } = fitWithin(image.width, image.height, maxEdge);
      image = await resizeImage(image, width, height);
    }
    return encodeResult(image, spec);
  },
  clear: () => session.clear(),
};

expose(api);
