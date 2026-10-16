import { expose } from 'comlink';
import { evaluateText, type NumberKind } from './logic';

export const api = {
  evaluate: (input: string, kind: NumberKind, precision: number) => evaluateText(input, kind, precision),
};

expose(api);
