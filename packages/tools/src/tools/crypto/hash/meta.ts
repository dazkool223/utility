import { defineTool } from '@/core/types';

export default defineTool({
  id: 'hash-text',
  path: 'crypto/hash',
  name: 'Hash Generator',
  description: 'MD5, SHA-1/2/3, Keccak, BLAKE2/3, RIPEMD-160 and xxHash of any text, all at once',
  category: 'crypto',
  audience: 'developer',
  priority: 'P0',
  aliases: ['md5', 'sha1', 'sha256', 'sha512', 'sha3', 'blake3', 'checksum', 'digest', 'crc32'],
  related: ['hmac-generate', 'file-checksum', 'hash-identify', 'bcrypt-hash'],
  inputKind: 'text',
  quickLauncher: true,
  example: { input: 'abc', expect: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
  load: () => import('./Tool'),
  steps: () =>
    import('./logic').then((m) =>
      [['md5', 'MD5'], ['sha1', 'SHA-1'], ['sha256', 'SHA-256'], ['sha512', 'SHA-512'], ['sha3-256', 'SHA3-256'], ['blake3', 'BLAKE3']].map(([id, name]) => ({
        id: `hash-text:${id}`,
        label: `Hash: ${name} (hex)`,
        run: (s: string) => m.hashText(s, id!),
      })),
    ),
});
