// Turns dist/build into two loadable extensions: dist/chrome and dist/firefox (Manifest V3).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const build = `${root}dist/build`;
const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));

// --- Icons: the "U" logo rasterised without external tools (Chrome needs PNG icons). ---
function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function icon(size) {
  const s = size / 64; // design grid is 64×64, matching public/icon.svg
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const inRoundedRect = (x, y) => {
    const r = 14 * s;
    const cx = Math.min(Math.max(x, r), size - r);
    const cy = Math.min(Math.max(y, r), size - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  const onU = (x, y) => {
    const w = 3.5 * s; // half stroke width
    const left = 20 * s, right = 44 * s, top = 18 * s, bottom = 36 * s, cx = 32 * s, rad = 12 * s;
    if (y <= bottom && y >= top - w) {
      if (Math.abs(x - left) <= w || Math.abs(x - right) <= w) return (y >= top) || Math.hypot(x - (Math.abs(x - left) <= w ? left : right), y - top) <= w;
    }
    if (y > bottom) return Math.abs(Math.hypot(x - cx, y - bottom) - rad) <= w;
    return false;
  };
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      // 4×4 supersampling for smooth edges
      let bg = 0, fg = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const px = x + (sx + 0.5) / 4, py = y + (sy + 0.5) / 4;
          if (inRoundedRect(px, py)) onU(px, py) ? fg++ : bg++;
        }
      const a = (bg + fg) / 16, f = fg / Math.max(1, bg + fg);
      const v = Math.round(0x17 + (0xfa - 0x17) * f);
      raw.set([v, v, v, Math.round(a * 255)], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const ICON_SIZES = [16, 32, 48, 128];
const icons = Object.fromEntries(ICON_SIZES.map((n) => [String(n), `icons/icon-${n}.png`]));

// Same zero-network rule as the Website (ADR 0001), as an extension-page CSP.
const csp =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; worker-src 'self'; frame-src 'self' blob:; base-uri 'none'; form-action 'none'";

const base = {
  manifest_version: 3,
  name: 'Utility — developer tools',
  short_name: 'Utility',
  version: pkg.version,
  description: 'Developer tools that run entirely in your browser: JSON, Base64, JWT, hashes, UUIDs and more. Nothing leaves your device.',
  icons,
  action: { default_popup: 'popup.html', default_title: 'Utility Quick Launcher', default_icon: icons },
  permissions: ['contextMenus', 'storage'],
  commands: {
    _execute_action: { suggested_key: { default: 'Alt+Shift+U' }, description: 'Open the Quick Launcher' },
  },
  content_security_policy: { extension_pages: csp },
};

const targets = {
  chrome: { ...base, background: { service_worker: 'background.js', type: 'module' }, minimum_chrome_version: '120' },
  firefox: {
    ...base,
    background: { scripts: ['background.js'], type: 'module' },
    browser_specific_settings: { gecko: { id: 'utility-devtools@utility.example', strict_min_version: '128.0' } },
  },
};

for (const [name, manifest] of Object.entries(targets)) {
  const out = `${root}dist/${name}`;
  rmSync(out, { recursive: true, force: true });
  cpSync(build, out, { recursive: true });
  mkdirSync(`${out}/icons`, { recursive: true });
  for (const n of ICON_SIZES) writeFileSync(`${out}/icons/icon-${n}.png`, icon(n));
  writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`Packaged ${name}: dist/${name}`);
}
