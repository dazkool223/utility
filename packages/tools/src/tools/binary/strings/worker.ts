import { expose } from 'comlink';
import { extractStringsFromBlob, type StringsOptions } from './logic';

export const api = {
  async extract(file: File, options: StringsOptions, onProgress: (fraction: number) => void) {
    return extractStringsFromBlob(file, options, onProgress);
  },
};

expose(api);
