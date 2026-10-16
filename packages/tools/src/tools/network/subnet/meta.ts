import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ipv4-subnet',
  path: 'network/subnet',
  name: 'IPv4 Subnet / CIDR Calculator',
  description: 'Network, broadcast, host range, mask and wildcard for any IPv4 address and prefix, with subnet splitting',
  category: 'network',
  audience: 'developer',
  priority: 'P0',
  aliases: ['cidr', 'subnet mask', 'netmask', 'subnetting', 'ip calculator', 'wildcard mask', 'broadcast address'],
  related: ['ip-range-cidr', 'ip-format', 'ipv6-tools'],
  inputKind: 'text',
  accepts: ['cidr', 'ip'],
  quickLauncher: true,
  example: { input: '192.168.1.10/24', expect: '192.168.1.255' },
  load: () => import('./Tool'),
});
