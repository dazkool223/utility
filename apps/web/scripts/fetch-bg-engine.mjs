// Downloads the Background Remover engine (ONNX Runtime WASM + the full-precision IS-Net model) from imgly's
// release host into public/engines/background-remover/, so the app serves it from its own origin (ADR 0001).
// This runs at build time only; the deployed app never contacts that host. Every chunk is checked against the
// SHA-256 in resources.json. Files already present are skipped, so re-runs are cheap.
//
// Layout written:
//   resources.json              the model's entry only (the library reads it to find the chunks)
//   <sha256>                    the model's 4 MB chunks, named by hash
//   onnxruntime-web/<file>      ONNX Runtime scripts and WASM, joined back into whole files. The patched library
//                               (patches/@imgly__background-removal*.patch) loads these by plain URL, because a blob: URL
//                               would need our Content-Security-Policy to allow blob: scripts and fetches.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = JSON.parse(readFileSync(new URL('../../../packages/tools/package.json', import.meta.url), 'utf8')).dependencies['@imgly/background-removal'].replace(/^[^\d]*/, '');
const SOURCE = `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/dist/`;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'engines', 'background-remover');
const MODEL = '/models/isnet';
const ORT = ['/onnxruntime-web/ort-wasm-simd-threaded.wasm', '/onnxruntime-web/ort-wasm-simd-threaded.mjs', '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm', '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs'];

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

async function chunk({ hash, name }) {
  const res = await fetch(SOURCE + name);
  if (!res.ok) throw new Error(`${SOURCE + name}: HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  if (sha256(data) !== hash) throw new Error(`Checksum mismatch for chunk ${name}`);
  return data;
}

mkdirSync(join(OUT, 'onnxruntime-web'), { recursive: true });
const metaRes = await fetch(SOURCE + 'resources.json');
if (!metaRes.ok) throw new Error(`resources.json: HTTP ${metaRes.status}`);
const all = await metaRes.json();
for (const key of [MODEL, ...ORT]) if (!all[key]) throw new Error(`resources.json has no ${key}`);

let fetched = 0;
for (const key of ORT) {
  const file = join(OUT, 'onnxruntime-web', basename(key));
  if (existsSync(file) && statSync(file).size === all[key].size) continue;
  const data = Buffer.concat(await Promise.all(all[key].chunks.map(chunk)));
  if (data.length !== all[key].size) throw new Error(`${key}: expected ${all[key].size} bytes, got ${data.length}`);
  writeFileSync(file, data);
  fetched++;
}
for (const c of all[MODEL].chunks) {
  const file = join(OUT, c.name);
  if (existsSync(file) && sha256(readFileSync(file)) === c.hash) continue;
  writeFileSync(file, await chunk(c));
  fetched++;
}
writeFileSync(join(OUT, 'resources.json'), JSON.stringify({ [MODEL]: all[MODEL] }));
console.log(`background-remover engine ${VERSION}: ${fetched} file(s) downloaded`);
