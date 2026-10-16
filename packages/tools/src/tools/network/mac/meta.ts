import { defineTool } from '@/core/types';

export default defineTool({
  id: 'mac-address',
  path: 'network/mac',
  name: 'MAC Address Generator / Formatter',
  description: 'Reformat MAC addresses (colon, hyphen, Cisco dot), inspect their flags, or generate random ones',
  category: 'network',
  priority: 'P1',
  aliases: ['mac address', 'mac format', 'eui-48', 'eui-64', 'random mac', 'oui'],
  related: ['ipv6-tools', 'ip-format', 'ipv4-subnet'],
  inputKind: 'text',
  example: { input: '00-1A-2B-3C-4D-5E', expect: '00:1a:2b:3c:4d:5e' },
  load: () => import('./Tool'),
});
