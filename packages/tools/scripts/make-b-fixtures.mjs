// Generates the small binary fixtures used by apps/web/e2e/agent-b-*.spec.ts.
// Run from packages/tools:  node scripts/make-b-fixtures.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';

const out = fileURLToPath(new URL('../../../apps/web/e2e/fixtures/', import.meta.url));
mkdirSync(out, { recursive: true });

// --- QR code PNG -----------------------------------------------------------
writeFileSync(out + 'b-qr.png', await QRCode.toBuffer('https://example.com/utility-qr', { width: 300, margin: 4 }));

// --- Plain PNG (gradient) --------------------------------------------------
function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw.set([r, g, b, a], y * (w * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
writeFileSync(out + 'b-gradient.png', png(64, 48, (x, y) => [Math.round((x / 63) * 255), Math.round((y / 47) * 255), 128, 255]));

// --- PDFs ------------------------------------------------------------------
async function makePdf(pages, label) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const p = doc.addPage([300, 200]);
    p.drawText(`${label} page ${i}`, { x: 30, y: 100, size: 20, font, color: rgb(0, 0, 0) });
  }
  return doc.save();
}
writeFileSync(out + 'b-two-pages.pdf', await makePdf(2, 'Alpha'));
writeFileSync(out + 'b-three-pages.pdf', await makePdf(3, 'Beta'));
console.log('fixtures written to', out);
