import { expose } from 'comlink';
import { estimateStrength } from './logic';

export const api = { estimate: (password: string) => estimateStrength(password) };

expose(api);
