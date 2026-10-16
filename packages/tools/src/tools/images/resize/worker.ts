import { expose } from 'comlink';
import { ToolError } from '@/core/types';
import { resizeImage, type EncodeSpec, type ResizeMethod } from '../_lib/codecs';
import { createSession, encodeResult } from '../_lib/session';

const session = createSession();

export const api = {
  load: (buf: ArrayBuffer) => session.load(buf),
  async resize(width: number, height: number, method: ResizeMethod, spec: EncodeSpec) {
    if (!(width >= 1 && height >= 1)) throw new ToolError('Width and height must each be at least 1 pixel.');
    const out = await resizeImage(session.image(), width, height, method);
    return encodeResult(out, spec);
  },
  clear: () => session.clear(),
};

expose(api);
