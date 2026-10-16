import { expose } from 'comlink';
import { formatKeyPair, generateRsa, type KeyFormat, type RsaOptions } from './logic';

export const api = {
  async generate(o: RsaOptions, format: KeyFormat): Promise<string> {
    return formatKeyPair(await generateRsa(o), format);
  },
};

expose(api);
