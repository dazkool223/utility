import { expose } from 'comlink';
import { generateCsrOrCert, type CsrOptions } from './logic';

export const api = {
  async generate(o: CsrOptions): Promise<string> {
    const r = await generateCsrOrCert(o);
    return `${r.outputPem}\n\n${r.privateKeyPem}`;
  },
};

expose(api);
