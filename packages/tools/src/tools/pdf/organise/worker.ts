import { expose, transfer } from 'comlink';
import { organisePdf, type PagePlan } from './logic';

export const api = {
  async organise(bytes: ArrayBuffer, plan: PagePlan[]) {
    const out = await organisePdf(bytes, plan);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
