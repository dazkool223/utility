import { useCallback, useState } from 'react';
import { GeneratorTool, NumberInput, OptionsBar, Select, TextInput } from '@/ui';
import { FIELDS, generateFake, MAX_ROWS, parseFieldList, type FakeFormat } from './logic';

export default function FakeData() {
  const [fields, setFields] = useState('name, email, phone, city');
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<FakeFormat>('json');
  const generate = useCallback(() => generateFake({ fields: parseFieldList(fields), count, format }), [fields, count, format]);
  return (
    <div className="flex flex-col gap-3">
      <GeneratorTool
        generate={generate}
        filename={format === 'csv' ? 'fake-data.csv' : format === 'json' ? 'fake-data.json' : 'fake-data.txt'}
        language={format === 'json' ? 'json' : 'text'}
        options={
          <OptionsBar>
            <TextInput label="Fields (comma separated)" value={fields} onChange={setFields} monospace testId="fake-fields" className="w-96 max-w-full" />
            <NumberInput label="Rows" value={count} onChange={setCount} min={1} max={MAX_ROWS} />
            <Select
              label="Format"
              value={format}
              onChange={setFormat}
              options={[
                { value: 'json', label: 'JSON array' },
                { value: 'ndjson', label: 'JSON lines' },
                { value: 'csv', label: 'CSV' },
                { value: 'lines', label: 'Plain lines' },
              ]}
            />
          </OptionsBar>
        }
      />
      <p className="m-0 text-xs text-muted-foreground">Available fields: {Object.keys(FIELDS).join(', ')}.</p>
    </div>
  );
}
