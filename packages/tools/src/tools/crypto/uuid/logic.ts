import { v1, v7 } from 'uuid';

export type UuidVersion = 'v4' | 'v7' | 'v1';

export interface UuidOptions {
  version: UuidVersion;
  count: number;
  uppercase: boolean;
  hyphens: boolean;
}

export const MAX_COUNT = 10_000;

export function generateUuids({ version, count, uppercase, hyphens }: UuidOptions): string {
  const make: () => string = version === 'v7' ? () => v7() : version === 'v1' ? () => v1() : () => crypto.randomUUID();
  const n = Math.max(1, Math.min(MAX_COUNT, Math.floor(count)));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let id = make();
    if (!hyphens) id = id.replace(/-/g, '');
    out.push(uppercase ? id.toUpperCase() : id);
  }
  return out.join('\n');
}
