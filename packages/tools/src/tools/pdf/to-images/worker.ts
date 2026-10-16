import { expose, transfer } from 'comlink';
import { zipStored } from '../_lib/zip';

export const api = {
  zip(files: Array<{ name: string; bytes: Uint8Array }>) {
    const bytes = zipStored(files);
    return transfer(bytes, [bytes.buffer]);
  },
};

expose(api);
