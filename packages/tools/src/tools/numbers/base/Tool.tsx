import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { NumberInput, OptionsBar, Select } from '@/ui';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { convertNumber } from './logic';

const BASES = [
  { value: 'auto', label: 'Auto (0x, 0b, 0o or decimal)' },
  { value: '2', label: 'Binary (2)' },
  { value: '8', label: 'Octal (8)' },
  { value: '10', label: 'Decimal (10)' },
  { value: '16', label: 'Hexadecimal (16)' },
  { value: '32', label: 'Base 32' },
  { value: '36', label: 'Base 36' },
  { value: '62', label: 'Base 62' },
];

export default function BaseTool({ initialInput }: ToolProps) {
  const [from, setFrom] = useState('auto');
  const [custom, setCustom] = useState(3);
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="255, 0xFF, 0b1010, -42, or any whole number…"
      deps={[from, custom]}
      options={
        <OptionsBar>
          <Select label="Input base" value={from} onChange={setFrom} options={BASES} />
          <NumberInput label="Extra output base" value={custom} onChange={setCustom} min={2} max={62} />
        </OptionsBar>
      }
      decode={(s) => {
        const r = convertNumber(s, from === 'auto' ? 'auto' : Number(from), custom);
        return [['Input read as', `base ${r.detectedBase}`], ...r.rows.map((x): [string, string] => [x.label, x.value])];
      }}
    />
  );
}
