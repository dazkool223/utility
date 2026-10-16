import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { allCases, CASES, convertCase, type CaseId } from './logic';

export default function CaseConverter({ initialInput }: ToolProps) {
  const [which, setWhich] = useState<CaseId | 'all'>('all');
  const modes = useMemo(
    () => [{ id: 'convert', label: 'Convert', run: (s: string) => (which === 'all' ? allCases(s) : convertCase(s, which)), filename: 'converted.txt' }],
    [which],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select label="Case" value={which} onChange={setWhich} options={[{ value: 'all', label: 'All cases at once' }, ...CASES.map((c) => ({ value: c.id, label: c.label }))]} />
        </OptionsBar>
      }
    />
  );
}
