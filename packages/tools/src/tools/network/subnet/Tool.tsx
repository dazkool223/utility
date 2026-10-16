import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, NumberInput, Checkbox } from '@/ui';
import { DecoderTool, type Row } from '../../crypto/_lib/DecoderTool';
import { calculateSubnet, splitSubnet } from './logic';

const fmt = (n: bigint) => n.toLocaleString('en');

export default function SubnetTool({ initialInput }: ToolProps) {
  const [split, setSplit] = useState(false);
  const [newPrefix, setNewPrefix] = useState(26);
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="192.168.1.10/24, or 192.168.1.10 255.255.255.0"
      deps={[split, newPrefix]}
      options={
        <OptionsBar>
          <Checkbox label="Split into smaller subnets" checked={split} onChange={setSplit} />
          {split && <NumberInput label="New prefix length" value={newPrefix} onChange={setNewPrefix} min={0} max={32} />}
        </OptionsBar>
      }
      decode={(s) => {
        const r = calculateSubnet(s);
        const rows: Row[] = [
          ['Address', r.address],
          ['CIDR notation', r.cidr],
          ['Network address', r.network],
          ['Broadcast address', r.broadcast],
          ['Subnet mask', r.netmask],
          ['Wildcard mask', r.wildcard],
          ['First usable host', r.firstHost],
          ['Last usable host', r.lastHost],
          ['Usable hosts', fmt(r.usableHosts)],
          ['Total addresses', fmt(r.totalAddresses)],
          ['Class', r.ipClass],
          ['Type', r.kind],
          ['Address (binary)', r.addressBinary],
          ['Mask (binary)', r.maskBinary],
          ['Address (integer)', r.integer.toString()],
          ['Address (hex)', r.hex],
        ];
        if (split) {
          const { subnets, total } = splitSubnet(s, newPrefix);
          rows.push([`Subnets (${fmt(total)})`, <span key="sub" className="whitespace-pre-wrap">{subnets.join('\n') + (BigInt(subnets.length) < total ? `\n… and ${fmt(total - BigInt(subnets.length))} more` : '')}</span>]);
        }
        return rows;
      }}
    />
  );
}
