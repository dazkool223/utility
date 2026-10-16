import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { repairJson } from './logic';

export default function JsonRepair({ initialInput }: ToolProps) {
  const [indent, setIndent] = useState('2');
  const modes = useMemo(() => [{ id: 'repair', label: 'Repair', run: (s: string) => repairJson(s, Number(indent)), outputLanguage: 'json' as const, filename: 'repaired.json' }], [indent]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Output"
            value={indent}
            onChange={setIndent}
            options={[
              { value: '2', label: 'Pretty (2 spaces)' },
              { value: '4', label: 'Pretty (4 spaces)' },
              { value: '0', label: 'Minimal changes' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
