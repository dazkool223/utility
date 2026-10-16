import { expose } from 'comlink';
import { hashBlob } from './logic';

export const api = {
  async hashFile(file: File, ids: string[], onProgress: (fraction: number) => void) {
    return hashBlob(file, ids, onProgress);
  },
};

expose(api);
