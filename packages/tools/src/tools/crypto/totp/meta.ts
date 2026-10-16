import { defineTool } from '@/core/types';

export default defineTool({
  id: 'totp-hotp',
  path: 'crypto/totp',
  name: 'TOTP / HOTP Generator & Validator',
  description: 'Generate and check one-time passcodes (Google Authenticator style) and make an otpauth:// link with QR code',
  category: 'crypto',
  audience: 'developer',
  priority: 'P1',
  aliases: ['totp', 'hotp', '2fa', 'otp', 'authenticator', 'mfa', 'one time password', 'otpauth'],
  related: ['qr-generate', 'nanoid-generate', 'hmac-generate'],
  inputKind: 'text',
  restrictions: [{ message: 'The code depends on your device clock. If a service rejects it, check that your system time is accurate.' }],
  example: { input: 'JBSWY3DPEHPK3PXP', expect: 'otpauth://totp/' },
  load: () => import('./Tool'),
});
