import { expose } from 'comlink';
import { comparePassword, hashPassword } from './logic';

export const api = {
  hash: (password: string, cost: number) => hashPassword(password, cost),
  compare: (password: string, hash: string) => comparePassword(password, hash),
};

expose(api);
