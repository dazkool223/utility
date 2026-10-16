import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ipv6-tools',
  path: 'network/ipv6',
  name: 'IPv6 Tools',
  description: 'Expand and compress IPv6 addresses, inspect prefixes, and generate unique local (ULA) networks',
  category: 'network',
  audience: 'developer',
  priority: 'P1',
  aliases: ['ipv6 expand', 'ipv6 compress', 'ipv6 shorten', 'ula', 'unique local address', 'ipv6 subnet', 'fd00'],
  related: ['ipv4-subnet', 'ip-format', 'ip-range-cidr', 'mac-address'],
  inputKind: 'text',
  example: { input: '2001:0db8:0000:0000:0000:ff00:0042:8329', expect: '2001:db8::ff00:42:8329' },
  load: () => import('./Tool'),
});
