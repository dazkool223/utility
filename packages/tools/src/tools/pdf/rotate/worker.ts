import { expose, transfer } from 'comlink';
import { pageCountOf } from '../_lib/info';
import { rotatePdf, type RotateAngle } from './logic';

export const api = {
  pageCount(bytes: ArrayBuffer) {
    return pageCountOf(bytes);
  },
  async rotate(bytes: ArrayBuffer, angle: RotateAngle, pages: string) {
    const out = await rotatePdf(bytes, angle, pages);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
