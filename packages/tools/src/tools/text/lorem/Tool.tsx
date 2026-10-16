import { useCallback, useState } from 'react';
import { Checkbox, GeneratorTool, NumberInput, OptionsBar, Select } from '@/ui';
import { generateLorem, MAX_COUNT, type LoremUnit } from './logic';

export default function LoremIpsum() {
  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStart] = useState(true);
  const [html, setHtml] = useState(false);
  const generate = useCallback(() => generateLorem({ unit, count, startWithLorem, html }), [unit, count, startWithLorem, html]);
  return (
    <GeneratorTool
      generate={generate}
      filename="lorem.txt"
      language={html ? 'html' : 'text'}
      options={
        <OptionsBar>
          <Select
            label="Unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'paragraphs', label: 'Paragraphs' },
              { value: 'sentences', label: 'Sentences' },
              { value: 'words', label: 'Words' },
            ]}
          />
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT[unit]} />
          <Checkbox label='Start with "Lorem ipsum"' checked={startWithLorem} onChange={setStart} />
          {unit !== 'words' && <Checkbox label="Wrap in <p> tags" checked={html} onChange={setHtml} />}
        </OptionsBar>
      }
    />
  );
}
