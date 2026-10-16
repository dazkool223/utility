import { ToolError } from '@/core/types';
import { MAX_DECOMPRESSED_BYTES, formatBytes, readStreamCapped } from '@/core/limits';
import { base64ToBytes, bytesToBase64 } from '../base64/logic';

export type CompressFormat = 'gzip' | 'deflate' | 'deflate-raw';

const bombError = (max: number) => new ToolError(`The decompressed data is larger than ${formatBytes(max)}, so it was stopped to protect your browser.`);

async function run(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, max = Infinity): Promise<Uint8Array> {
  const source = new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  const chunks = await readStreamCapped(source, max, bombError);
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

export async function compressToBase64(text: string, format: CompressFormat, urlSafe = false): Promise<string> {
  const out = await run(new TextEncoder().encode(text), new CompressionStream(format));
  const b64 = bytesToBase64(out);
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

function detect(bytes: Uint8Array): CompressFormat {
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) return 'gzip';
  if (bytes.length > 1 && (bytes[0]! & 0x0f) === 8 && ((bytes[0]! << 8) | bytes[1]!) % 31 === 0) return 'deflate';
  return 'deflate-raw';
}

export async function decompressFromBase64(input: string, format: CompressFormat | 'auto'): Promise<string> {
  const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(clean) || clean.length % 4 === 1) throw new ToolError('This is not valid Base64, so it cannot be decompressed.');
  const bytes = base64ToBytes(clean + '='.repeat((4 - (clean.length % 4)) % 4));
  const fmt = format === 'auto' ? detect(bytes) : format;
  let out: Uint8Array;
  try {
    out = await run(bytes, new DecompressionStream(fmt), MAX_DECOMPRESSED_BYTES);
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(`These bytes are not valid ${fmt} data. Check the format, or try "Detect automatically".`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(out);
  } catch {
    throw new ToolError('The decompressed data is not UTF-8 text.');
  }
}
