import { useCallback, useState } from 'react';
import { Checkbox, GeneratorTool, NumberInput, OptionsBar, Select } from '@/ui';
import { generateUuids, MAX_COUNT, type UuidVersion } from './logic';

export default function UuidTool() {
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const generate = useCallback(() => generateUuids({ version, count, uppercase, hyphens }), [version, count, uppercase, hyphens]);
  return (
    <GeneratorTool
      generate={generate}
      filename="uuids.txt"
      options={
        <OptionsBar>
          <Select
            label="Version"
            value={version}
            onChange={setVersion}
            options={[
              { value: 'v4', label: 'v4 (random)' },
              { value: 'v7', label: 'v7 (time-ordered)' },
              { value: 'v1', label: 'v1 (time + node)' },
            ]}
          />
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
          <Checkbox label="Uppercase" checked={uppercase} onChange={setUppercase} />
          <Checkbox label="Hyphens" checked={hyphens} onChange={setHyphens} />
        </OptionsBar>
      }
    />
  );
}
