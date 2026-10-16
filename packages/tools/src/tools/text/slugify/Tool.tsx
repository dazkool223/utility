import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextInput, TextTransform } from '@/ui';
import { slugifyLines } from './logic';

export default function Slugify({ initialInput }: ToolProps) {
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [decamelize, setDecamelize] = useState(true);
  const modes = useMemo(() => [{ id: 'slug', label: 'Slugify', run: (s: string) => slugifyLines(s, { separator, lowercase, decamelize }), filename: 'slugs.txt' }], [separator, lowercase, decamelize]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <TextInput label="Separator" value={separator} onChange={setSeparator} monospace className="w-24" />
          <Checkbox label="Lowercase" checked={lowercase} onChange={setLowercase} />
          <Checkbox label="Split camelCase" checked={decamelize} onChange={setDecamelize} />
        </OptionsBar>
      }
    />
  );
}
