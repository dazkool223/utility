import { expose } from 'comlink';
import { validateSignatures } from './logic';

export const api = {
  async validate(bytes: ArrayBuffer) {
    return validateSignatures(bytes);
  },
};

expose(api);
