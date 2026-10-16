import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextInput, TextTransform } from '@/ui';
import { jsonToSql, type Dialect } from './logic';

export default function JsonSql({ initialInput }: ToolProps) {
  const [dialect, setDialect] = useState<Dialect>('postgres');
  const [table, setTable] = useState('my_table');
  const [create, setCreate] = useState(true);
  const modes = useMemo(
    () => [{ id: 'sql', label: 'To SQL', run: (s: string) => jsonToSql(s, { table, dialect, createTable: create }), inputLanguage: 'json' as const, outputLanguage: 'sql' as const, filename: 'data.sql' }],
    [table, dialect, create],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Dialect"
            value={dialect}
            onChange={setDialect}
            options={[
              { value: 'postgres', label: 'PostgreSQL' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'sqlite', label: 'SQLite' },
              { value: 'mssql', label: 'SQL Server' },
            ]}
          />
          <TextInput label="Table name" value={table} onChange={setTable} monospace />
          <Checkbox label="Include CREATE TABLE" checked={create} onChange={setCreate} />
        </OptionsBar>
      }
    />
  );
}
