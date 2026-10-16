import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { markdownTableToCsv, toMarkdownTable, type Align, type Delim } from './logic';

export default function MarkdownTable({ initialInput }: ToolProps) {
  const [delimiter, setDelimiter] = useState<Delim>('auto');
  const [align, setAlign] = useState<Align>('left');
  const [pad, setPad] = useState(true);
  const modes = useMemo(
    () => [
      { id: 'to-md', label: 'CSV → Markdown', run: (s: string) => toMarkdownTable(s, { delimiter, align, pad }), outputLanguage: 'markdown' as const, filename: 'table.md' },
      { id: 'to-csv', label: 'Markdown → CSV', run: (s: string) => markdownTableToCsv(s, delimiter === 'auto' ? ',' : delimiter), inputLanguage: 'markdown' as const, filename: 'table.csv' },
    ],
    [delimiter, align, pad],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Delimiter"
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: 'auto', label: 'Detect automatically' },
              { value: ',', label: 'Comma' },
              { value: '\t', label: 'Tab (paste from a spreadsheet)' },
              { value: ';', label: 'Semicolon' },
              { value: '|', label: 'Pipe' },
            ]}
          />
          <Select
            label="Column alignment"
            value={align}
            onChange={setAlign}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
              { value: 'none', label: 'Default' },
            ]}
          />
          <Checkbox label="Pad columns to equal width" checked={pad} onChange={setPad} />
        </OptionsBar>
      }
    />
  );
}
