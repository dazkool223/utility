import { defineTool } from '@/core/types';

export default defineTool({
  id: 'qr-generate',
  path: 'numbers/qr',
  name: 'QR Code Generator',
  description: 'Make a QR code from text or a link and download it as PNG or SVG',
  category: 'numbers',
  priority: 'P0',
  aliases: ['qr', 'qrcode', 'qr code', 'barcode', 'url to qr', 'wifi qr'],
  related: ['qr-decode', 'totp-hotp', 'colour-converter'],
  inputKind: 'text',
  accepts: ['url'],
  example: { input: 'https://example.com', expect: '<svg' },
  load: () => import('./Tool'),
});
