import { expose, transfer } from 'comlink';
import { unlockPdf } from './logic';

export const api = {
  async unlock(bytes: ArrayBuffer, password: string) {
    const out = await unlockPdf(bytes, password);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
