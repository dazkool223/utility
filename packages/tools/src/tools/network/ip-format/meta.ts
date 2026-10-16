import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ip-format',
  path: 'network/ip-format',
  name: 'IP Address Format Converter',
  description: 'Convert an IP address between dotted, integer, hex, octal, binary and IPv6-mapped forms',
  category: 'network',
  audience: 'developer',
  priority: 'P1',
  aliases: ['ip to decimal', 'ip to integer', 'ip to hex', 'ip to binary', 'inet_aton', 'reverse dns', 'ptr record'],
  related: ['ipv4-subnet', 'ipv6-tools', 'ip-range-cidr', 'number-base'],
  inputKind: 'text',
  accepts: ['ip'],
  example: { input: '192.168.1.1', expect: '3232235777' },
  load: () => import('./Tool'),
});
