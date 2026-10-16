import { ToolError } from '@/core/types';

export interface QrRead {
  text: string;
  kind: string;
  /** Corner points in the decoded image, for display. */
  corners: Array<[number, number]>;
}

export function classifyPayload(text: string): string {
  if (/^https?:\/\//i.test(text)) return 'Web link';
  if (/^WIFI:/i.test(text)) return 'Wi-Fi network';
  if (/^mailto:/i.test(text)) return 'E-mail address';
  if (/^tel:/i.test(text)) return 'Phone number';
  if (/^smsto?:/i.test(text)) return 'SMS';
  if (/^geo:/i.test(text)) return 'Location';
  if (/^otpauth:\/\//i.test(text)) return 'One-time password (2FA) setup';
  if (/^BEGIN:VCARD/i.test(text)) return 'Contact card (vCard)';
  if (/^BEGIN:VEVENT|^BEGIN:VCALENDAR/i.test(text)) return 'Calendar event';
  if (/^bitcoin:|^ethereum:|^lightning:/i.test(text)) return 'Payment request';
  return 'Text';
}

/** Decodes a QR code from RGBA pixels. Returns null if none is found. Tries inverted colours too. */
export async function decodeQrPixels(data: Uint8ClampedArray, width: number, height: number): Promise<QrRead | null> {
  if (width < 21 || height < 21) throw new ToolError('The image is too small to contain a QR code.');
  if (data.length !== width * height * 4) throw new ToolError('The image data is damaged.');
  const jsQR = (await import('jsqr')).default;
  const r = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  if (!r) return null;
  return {
    text: r.data,
    kind: classifyPayload(r.data),
    corners: [r.location.topLeftCorner, r.location.topRightCorner, r.location.bottomRightCorner, r.location.bottomLeftCorner].map((p) => [Math.round(p.x), Math.round(p.y)] as [number, number]),
  };
}
