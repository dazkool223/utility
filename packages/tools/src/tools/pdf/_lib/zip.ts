import { zipSync } from 'fflate';

/** Store files in a ZIP without recompressing (PDF and image data is already compressed). */
export function zipStored(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const f of files) entries[f.name] = [f.bytes, { level: 0 }];
  return zipSync(entries);
}
