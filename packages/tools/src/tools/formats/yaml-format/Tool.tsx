import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { formatYaml } from './logic';

export default function YamlFormat({ initialInput }: ToolProps) {
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const modes = useMemo(
    () => [{ id: 'format', label: 'Format', run: (s: string) => formatYaml(s, { indent: indent === '4' ? 4 : 2, sortKeys }), inputLanguage: 'yaml' as const, filename: 'formatted.yaml' }],
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
            ]}
          />
          <Checkbox label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
        </OptionsBar>
      }
    />
  );
}
