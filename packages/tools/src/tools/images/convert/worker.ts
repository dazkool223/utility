import { expose } from 'comlink';
import { decodeImage, warmEncoder, type EncodeSpec } from '../_lib/codecs';
import { encodeResult } from '../_lib/session';

export const api = {
  /** Load an encoder's WASM in the background. */
  warm(format: EncodeSpec['format']) {
    return warmEncoder(format);
  },

  /** Decode one file and re-encode it in the requested format. */
  async convert(buf: ArrayBuffer, spec: EncodeSpec) {
    const image = await decodeImage(buf);
    return encodeResult(image, spec);
  },
};

expose(api);
