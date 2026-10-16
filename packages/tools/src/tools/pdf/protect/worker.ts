import { expose, transfer } from 'comlink';
import { protectPdf, type ProtectOptions } from './logic';

export const api = {
  async protect(bytes: ArrayBuffer, options: ProtectOptions) {
    const out = await protectPdf(bytes, options);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
