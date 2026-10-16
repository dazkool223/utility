import { useCallback, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, GeneratorTool, NumberInput, OptionsBar, Segmented, Select, TextInput } from '@/ui';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { MAX_COUNT, describeMac, generateMacs, type MacSeparator } from './logic';

const SEPS = [
  { value: ':', label: 'Colon  aa:bb:cc' },
  { value: '-', label: 'Hyphen  aa-bb-cc' },
  { value: '.', label: 'Dot  aabb.ccdd' },
  { value: '', label: 'None  aabbcc' },
] as const;

function Generate() {
  const [count, setCount] = useState(5);
  const [separator, setSeparator] = useState<MacSeparator>(':');
  const [upper, setUpper] = useState(false);
  const [administration, setAdministration] = useState<'local' | 'global'>('local');
  const [multicast, setMulticast] = useState(false);
  const [oui, setOui] = useState('');
  const generate = useCallback(() => generateMacs({ count, separator, upper, administration, multicast, oui }), [count, separator, upper, administration, multicast, oui]);
  return (
    <GeneratorTool
      generate={generate}
      filename="mac-addresses.txt"
      options={
        <OptionsBar>
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
          <Select label="Separator" value={separator} onChange={setSeparator} options={SEPS.map((s) => ({ value: s.value, label: s.label }))} />
          <Select label="Administration" value={administration} onChange={setAdministration} options={[{ value: 'local', label: 'Locally administered (private use)' }, { value: 'global', label: 'Universally administered' }]} />
          <TextInput label="Vendor prefix / OUI (optional)" value={oui} onChange={setOui} monospace className="w-36" />
          <Checkbox label="Uppercase" checked={upper} onChange={setUpper} />
          <Checkbox label="Multicast bit" checked={multicast} onChange={setMulticast} />
        </OptionsBar>
      }
    />
  );
}

export default function MacTool({ initialInput }: ToolProps) {
  const [mode, setMode] = useState<'format' | 'generate'>('format');
  return (
    <div className="flex flex-col gap-3">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format / inspect' }, { value: 'generate', label: 'Generate' }]} />
      {mode === 'generate' ? <Generate /> : <DecoderTool initialInput={initialInput} placeholder="00:1A:2B:3C:4D:5E" decode={(s) => describeMac(s)} />}
    </div>
  );
}
