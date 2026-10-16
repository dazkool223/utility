import { defineTool } from '@/core/types';

export default defineTool({
  id: 'ip-range-cidr',
  path: 'network/ip-range',
  name: 'IP Range to CIDR / Merger',
  description: 'Turn IP ranges into CIDR blocks, CIDR blocks into ranges, or merge a list into the smallest set of blocks',
  category: 'network',
  priority: 'P1',
  aliases: ['ip range to cidr', 'cidr to ip range', 'cidr merge', 'cidr aggregation', 'summarize cidr', 'supernet'],
  related: ['ipv4-subnet', 'ipv6-tools', 'ip-format'],
  inputKind: 'text',
  example: { input: '10.0.0.1 - 10.0.0.6', expect: '10.0.0.2/31' },
  load: () => import('./Tool'),
});
