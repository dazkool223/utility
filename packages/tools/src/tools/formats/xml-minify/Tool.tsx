import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextTransform } from '@/ui';
import { minifyXml } from './logic';

export default function XmlMinify({ initialInput }: ToolProps) {
  const [strip, setStrip] = useState(true);
  const modes = useMemo(() => [{ id: 'minify', label: 'Minify', run: (s: string) => minifyXml(s, strip), inputLanguage: 'xml' as const, filename: 'minified.xml' }], [strip]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Remove comments" checked={strip} onChange={setStrip} />
        </OptionsBar>
      }
    />
  );
}
