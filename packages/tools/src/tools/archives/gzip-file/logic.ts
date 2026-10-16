import { ToolError } from '@/core/types';

export type GzipMode = 'compress' | 'decompress';

/** True when the bytes start with the gzip magic number (1f 8b). */
export function isGzip(head: Uint8Array): boolean {
  return head.length >= 2 && head[0] === 0x1f && head[1] === 0x8b;
}

export function hasCompressionStreams(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/** Output file name: `a.txt` <-> `a.txt.gz`; `.tgz` unpacks to `.tar`. */
export function outputName(name: string, mode: GzipMode): string {
  if (mode === 'compress') return `${name || 'file'}.gz`;
  const lower = name.toLowerCase();
  if (lower.endsWith('.tgz')) return name.slice(0, -4) + '.tar';
  if (lower.endsWith('.gz') && name.length > 3) return name.slice(0, -3);
  return `${name || 'file'}.out`;
}

async function pipe(blob: Blob, transform: unknown, type: string): Promise<Blob> {
  const out = blob.stream().pipeThrough(transform as ReadableWritablePair<Uint8Array, Uint8Array>);
  const bytes = await new Response(out).arrayBuffer();
  return new Blob([bytes], { type });
}

/** Streams `blob` through the browser's native gzip encoder. */
export async function gzipBlob(blob: Blob): Promise<Blob> {
  if (!hasCompressionStreams()) throw new ToolError('This browser cannot compress or decompress gzip files.');
  return pipe(blob, new CompressionStream('gzip'), 'application/gzip');
}

/** Streams `blob` through the native gzip decoder. Throws a ToolError for anything that is not valid gzip. */
export async function gunzipBlob(blob: Blob): Promise<Blob> {
  if (!hasCompressionStreams()) throw new ToolError('This browser cannot compress or decompress gzip files.');
  if (blob.size === 0) throw new ToolError('The file is empty.');
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (!isGzip(head)) throw new ToolError('This is not a gzip file (it does not start with the gzip signature).');
  try {
    return await pipe(blob, new DecompressionStream('gzip'), 'application/octet-stream');
  } catch {
    throw new ToolError('The gzip data is damaged or truncated and could not be decompressed.');
  }
}
