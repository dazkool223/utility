/**
 * Test-only: load the jSquash WASM binaries from node_modules and hand them to the codecs, so the
 * encode/decode round-trip tests run in Node exactly like the browser worker does (just without fetch).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

function wasm(pkg: string, rel: string): Promise<WebAssembly.Module> {
  const root = dirname(require.resolve(`@jsquash/${pkg}/package.json`));
  return WebAssembly.compile(readFileSync(join(root, rel)));
}

let ready: Promise<void> | undefined;

export function setupWasm(): Promise<void> {
  ready ??= (async () => {
    if (typeof globalThis.ImageData === 'undefined') {
      class NodeImageData {
        constructor(
          public data: Uint8ClampedArray,
          public width: number,
          public height: number,
        ) {}
      }
      (globalThis as unknown as { ImageData: unknown }).ImageData = NodeImageData;
    }
    await Promise.all([
      import('@jsquash/png/encode').then(async (m) => m.init(await wasm('png', 'codec/pkg/squoosh_png_bg.wasm'))),
      import('@jsquash/png/decode').then(async (m) => m.init(await wasm('png', 'codec/pkg/squoosh_png_bg.wasm'))),
      import('@jsquash/jpeg/encode').then(async (m) => m.init(await wasm('jpeg', 'codec/enc/mozjpeg_enc.wasm'))),
      import('@jsquash/jpeg/decode').then(async (m) => m.init(await wasm('jpeg', 'codec/dec/mozjpeg_dec.wasm'))),
      import('@jsquash/webp/encode').then(async (m) => m.init(await wasm('webp', 'codec/enc/webp_enc.wasm'))),
      import('@jsquash/webp/decode').then(async (m) => m.init(await wasm('webp', 'codec/dec/webp_dec.wasm'))),
      import('@jsquash/avif/encode').then(async (m) => m.init(await wasm('avif', 'codec/enc/avif_enc.wasm'))),
      import('@jsquash/avif/decode').then(async (m) => m.init(await wasm('avif', 'codec/dec/avif_dec.wasm'))),
      import('@jsquash/jxl/encode').then(async (m) => m.init(await wasm('jxl', 'codec/enc/jxl_enc.wasm'))),
      import('@jsquash/jxl/decode').then(async (m) => m.init(await wasm('jxl', 'codec/dec/jxl_dec.wasm'))),
      import('@jsquash/qoi/encode').then(async (m) => m.init(await wasm('qoi', 'codec/enc/qoi_enc.wasm'))),
      import('@jsquash/qoi/decode').then(async (m) => m.init(await wasm('qoi', 'codec/dec/qoi_dec.wasm'))),
      import('@jsquash/oxipng/optimise').then(async (m) => m.init(await wasm('oxipng', 'codec/pkg/squoosh_oxipng_bg.wasm'))),
      import('@jsquash/resize').then(async (m) => m.initResize(await wasm('resize', 'lib/resize/pkg/squoosh_resize_bg.wasm'))),
    ]);
  })();
  return ready;
}
