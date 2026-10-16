import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { formatSql, SQL_DIALECTS, type KeywordCase, type SqlDialect, type SqlFormatOptions } from './logic';

export default function SqlFormat({ initialInput }: ToolProps) {
  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [indent, setIndent] = useState<SqlFormatOptions['indent']>('2');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const modes = useMemo(
    () => [
      {
        id: 'format',
        label: 'Format',
        run: (s: string) => formatSql(s, { dialect, indent, keywordCase, linesBetweenQueries: 1 }),
        inputLanguage: 'sql' as const,
        filename: 'formatted.sql',
      },
    ],
    [dialect, indent, keywordCase],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select label="Dialect" value={dialect} onChange={setDialect} options={SQL_DIALECTS.map(([value, label]) => ({ value, label }))} />
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
          <Select
            label="Keywords"
            value={keywordCase}
            onChange={setKeywordCase}
            options={[
              { value: 'upper', label: 'UPPER CASE' },
              { value: 'lower', label: 'lower case' },
              { value: 'preserve', label: 'Keep as typed' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
