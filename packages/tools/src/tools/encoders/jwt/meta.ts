import { defineTool } from '@/core/types';

export default defineTool({
  id: 'jwt-decode',
  path: 'encoders/jwt',
  name: 'JWT Decoder',
  description: 'Decode a JSON Web Token: header, payload, expiry dates and status (the signature is not verified)',
  category: 'encoders',
  priority: 'P0',
  aliases: ['json web token', 'jwt parser', 'bearer token', 'decode jwt', 'jwt debugger', 'access token'],
  related: ['base64-text', 'json-format'],
  inputKind: 'text',
  accepts: ['jwt'],
  quickLauncher: true,
  contextMenu: 'Decode JWT',
  restrictions: [{ message: 'This only decodes a token. It does not verify the signature, so do not treat the contents as trusted.' }],
  example: {
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expect: '"name": "John Doe"',
  },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) => [
      { id: 'jwt-decode:payload', label: 'JWT: payload', run: (s: string) => m.jwtPayloadText(s) },
      { id: 'jwt-decode:header', label: 'JWT: header', run: (s: string) => m.jwtHeaderText(s) },
    ]),
});
