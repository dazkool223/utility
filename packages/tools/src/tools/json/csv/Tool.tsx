import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { Checkbox, OptionsBar, Select, TextTransform, type TransformMode } from '@/ui';
import { csvToJson, jsonToCsv, type Delimiter } from './logic';

export default function JsonCsv({ initialInput }: ToolProps) {
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [flat, setFlat] = useState(true);
  const [types, setTypes] = useState(true);
  const [unflatten, setUnflatten] = useState(false);
  const [csvFirst] = useState(() => !!initialInput && detectText(initialInput).includes('csv') && !detectText(initialInput).includes('json'));
  const modes = useMemo(() => {
    const toCsv: TransformMode = { id: 'to-csv', label: 'JSON → CSV', run: (s) => jsonToCsv(s, delimiter, flat), inputLanguage: 'json', filename: 'data.csv' };
    const toJson: TransformMode = { id: 'to-json', label: 'CSV → JSON', run: (s) => csvToJson(s, delimiter, { types, unflatten }), outputLanguage: 'json', filename: 'data.json' };
    return csvFirst ? [toJson, toCsv] : [toCsv, toJson];
  }, [delimiter, flat, types, unflatten, csvFirst]);
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
              { value: ',', label: 'Comma' },
              { value: ';', label: 'Semicolon' },
              { value: '\t', label: 'Tab' },
              { value: '|', label: 'Pipe' },
            ]}
          />
          <Checkbox label="Flatten nested objects (a.b)" checked={flat} onChange={setFlat} />
          <Checkbox label="Detect numbers and booleans" checked={types} onChange={setTypes} />
          <Checkbox label="Unflatten a.b headers" checked={unflatten} onChange={setUnflatten} />
        </OptionsBar>
      }
    />
  );
}
