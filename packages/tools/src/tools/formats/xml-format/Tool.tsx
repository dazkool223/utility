import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { formatXml, type XmlFormatOptions } from './logic';

export default function XmlFormat({ initialInput }: ToolProps) {
  const [indent, setIndent] = useState<XmlFormatOptions['indent']>('2');
  const [collapse, setCollapse] = useState(true);
  const modes = useMemo(
    () => [{ id: 'format', label: 'Format', run: (s: string) => formatXml(s, { indent, collapseContent: collapse }), inputLanguage: 'xml' as const, filename: 'formatted.xml' }],
    [indent, collapse],
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
              { value: 'tab', label: 'Tab' },
            ]}
          />
          <Checkbox label="Keep short text on one line" checked={collapse} onChange={setCollapse} />
        </OptionsBar>
      }
    />
  );
}
