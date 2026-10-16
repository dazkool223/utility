import { parseJson } from '../format/logic';

export function minifyJson(input: string): string {
  return JSON.stringify(parseJson(input));
}
