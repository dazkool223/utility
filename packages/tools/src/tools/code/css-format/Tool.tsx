import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { DEFAULT_CSS_OPTIONS, formatCss, type CssFormatOptions } from './logic';

export default function CssFormat({ initialInput }: ToolProps) {
  const [o, setO] = useState<CssFormatOptions>(DEFAULT_CSS_OPTIONS);
  const set = <K extends keyof CssFormatOptions>(k: K) => (v: CssFormatOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(() => [{ id: 'format', label: 'Format', run: (s: string) => formatCss(s, o), inputLanguage: 'css' as const, filename: `formatted.${o.language}` }], [o]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Language"
            value={o.language}
            onChange={set('language')}
            options={[
              { value: 'css', label: 'CSS' },
              { value: 'scss', label: 'SCSS' },
              { value: 'less', label: 'Less' },
            ]}
          />
          <Select
            label="Indent"
            value={o.indent}
            onChange={set('indent')}
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
              { value: 'tab', label: 'Tab' },
            ]}
          />
          <Checkbox label="Single quotes" checked={o.singleQuote} onChange={set('singleQuote')} />
        </OptionsBar>
      }
    />
  );
}
