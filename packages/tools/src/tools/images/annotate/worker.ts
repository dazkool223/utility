import { expose } from 'comlink';
import type { EncodeSpec } from '../_lib/codecs';
import { createSession, encodeResult, makePreview } from '../_lib/session';
import { renderAnnotations } from './draw';
import type { Annotation } from './logic';

const session = createSession();

export const api = {
  load: (buf: ArrayBuffer) => session.load(buf),
  /** The picture with every annotation applied, scaled to fit `maxEdge` for the screen. */
  preview(annotations: Annotation[], maxEdge: number) {
    return makePreview(renderAnnotations(session.image(), annotations), maxEdge);
  },
  async save(annotations: Annotation[], spec: EncodeSpec) {
    return encodeResult(renderAnnotations(session.image(), annotations), spec);
  },
  clear: () => session.clear(),
};

expose(api);
