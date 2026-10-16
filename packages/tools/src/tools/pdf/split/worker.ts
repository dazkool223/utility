import { expose, transfer } from 'comlink';
import { pageCountOf } from '../_lib/info';
import { splitToOutput, type SplitOptions } from './logic';

export const api = {
  pageCount(bytes: ArrayBuffer) {
    return pageCountOf(bytes);
  },
  async split(bytes: ArrayBuffer, base: string, options: SplitOptions) {
    const out = await splitToOutput(bytes, base, options);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
