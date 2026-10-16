import { useCallback, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { GeneratorTool, Segmented } from '@/ui';
import { DecoderTool, type Row } from '../../crypto/_lib/DecoderTool';
import { generateUla, inspectV6 } from './logic';

export default function Ipv6Tool({ initialInput }: ToolProps) {
  const [mode, setMode] = useState<'inspect' | 'ula'>('inspect');
  const generate = useCallback(() => {
    const u = generateUla(undefined, 8);
    return [`Global ID: ${u.globalId}`, `Prefix (/48): ${u.prefix48}`, '', 'Example /64 subnets:', ...u.subnets, '', `Example address: ${u.sample}`].join('\n');
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'inspect', label: 'Expand / compress / inspect' }, { value: 'ula', label: 'Generate ULA network' }]} />
      {mode === 'ula' ? (
        <GeneratorTool generate={generate} filename="ula.txt" />
      ) : (
        <DecoderTool
          initialInput={initialInput}
          placeholder="2001:db8::1 or 2001:db8::/32"
          decode={(s) => {
            const i = inspectV6(s);
            const rows: Row[] = [
              ['Compressed', i.compressed],
              ['Expanded', i.expanded],
              ['Type', i.type],
              ['/64 network', i.subnetPrefix64],
              ['Interface ID', i.interfaceId],
            ];
            if (i.network) rows.push(['Network', i.network], ['First address', i.first!], ['Last address', i.last!], ['Addresses', i.count!.toLocaleString('en')]);
            if (i.embeddedV4) rows.push(['Embedded IPv4', i.embeddedV4]);
            rows.push(['Reverse DNS (PTR)', i.reverse]);
            return rows;
          }}
        />
      )}
    </div>
  );
}
