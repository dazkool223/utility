import { defineTool } from '@/core/types';

export default defineTool({
  id: 'qr-decode',
  path: 'numbers/qr-decode',
  name: 'QR Code Decoder',
  description: 'Read the text or link inside a QR code from an image file or your camera',
  category: 'numbers',
  priority: 'P1',
  aliases: ['qr reader', 'qr scanner', 'scan qr', 'read qr code', 'decode qr'],
  related: ['qr-generate', 'totp-hotp'],
  inputKind: 'image',
  restrictions: [
    { message: 'Camera scanning needs a camera and your permission. It is not available in this browser or context, so use an image file instead.', applies: () => typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia },
  ],
  load: () => import('./Tool'),
});
