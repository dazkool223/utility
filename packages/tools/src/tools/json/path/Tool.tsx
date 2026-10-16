import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, TextInput, TextTransform } from '@/ui';
import { queryJsonPath } from './logic';

export default function JsonPathTool({ initialInput }: ToolProps) {
  const [expr, setExpr] = useState('$..*');
  const modes = useMemo(() => [{ id: 'query', label: 'Query', run: (s: string) => queryJsonPath(s, expr), inputLanguage: 'json' as const, outputLanguage: 'json' as const, filename: 'matches.json' }], [expr]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <TextInput label="JSONPath expression" value={expr} onChange={setExpr} monospace testId="jsonpath-expression" className="w-96 max-w-full" placeholder="$.store.book[*].title" />
        </OptionsBar>
      }
    />
  );
}
