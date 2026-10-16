import { expose } from 'comlink';
import { removeBackground } from '@imgly/background-removal';
import { parseHexColor } from './logic';

/**
 * Engine files (ONNX Runtime and the full-precision IS-Net model) are served from our own origin;
 * apps/web/scripts/fetch-bg-engine.mjs puts them there at build time. Nothing comes from a CDN (ADR 0001).
 */
const PUBLIC_PATH = new URL('/engines/background-remover/', self.location.origin).href;

const UNSUPPORTED = 'This browser does not support OffscreenCanvas, which the Background Remover needs. Use a current Chrome, Edge, Firefox or Safari.';

async function cutout(buf: ArrayBuffer, mime: string, onProgress: (key: string, current: number, total: number) => void) {
  if (typeof OffscreenCanvas === 'undefined') throw new Error(UNSUPPORTED);
  const image = new Blob([buf], { type: mime });
  // The library wraps callbacks in a validator that inspects them, which breaks a Comlink proxy; hand it a plain function.
  const progress = (key: string, current: number, total: number) => void onProgress(key, current, total);
  const run = (device: 'gpu' | 'cpu') => removeBackground(image, { publicPath: PUBLIC_PATH, model: 'isnet', device, output: { format: 'image/png' }, progress });
  try {
    // WebGPU is much faster when the browser has it; fall back to the CPU build if it fails to start.
    const out = 'gpu' in navigator ? await run('gpu').catch(() => run('cpu')) : await run('cpu');
    return new Uint8Array(await out.arrayBuffer());
  } catch (e) {
    throw new Error(`The background could not be removed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Puts a transparent PNG on a solid colour and returns a PNG. */
async function flatten(png: Uint8Array, hex: string) {
  if (typeof OffscreenCanvas === 'undefined') throw new Error(UNSUPPORTED);
  const rgb = parseHexColor(hex);
  if (!rgb) throw new Error('That is not a valid colour. Use a value like #ffffff.');
  const bitmap = await createImageBitmap(new Blob([png as BlobPart], { type: 'image/png' }));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  ctx.fillRect(0, 0, bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer());
}

export const api = { cutout, flatten };

expose(api);
