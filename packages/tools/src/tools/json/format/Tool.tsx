import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { formatJson, type Indent } from './logic';

export default function JsonFormat({ initialInput }: ToolProps) {
  const [indent, setIndent] = useState<Indent>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const modes = useMemo(
    () => [{ id: 'format', label: 'Format', run: (s: string) => formatJson(s, { indent, sortKeys }), inputLanguage: 'json' as const, filename: 'formatted.json' }],
    [indent, sortKeys],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Indent"
            value={indent}
            onChange={setIndent}
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
              { value: 'tab', label: 'Tab' },
            ]}
          />
          <Checkbox label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
        </OptionsBar>
      }
    />
  );
}
