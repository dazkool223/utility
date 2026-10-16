import { expose } from 'comlink';
import { generateSshKey, type SshKeyOptions } from './logic';

export const api = {
  async generate(o: SshKeyOptions): Promise<string> {
    const k = await generateSshKey(o);
    return `${k.privateKey}\n${k.publicKey}\n\n${k.sha256}`;
  },
};

expose(api);
