import { expose, transfer } from 'comlink';
import { mergePdfs, type MergeInput } from './logic';

export const api = {
  async merge(inputs: MergeInput[]) {
    const { bytes, pageCount } = await mergePdfs(inputs);
    return transfer({ bytes, pageCount }, [bytes.buffer]);
  },
};

expose(api);
