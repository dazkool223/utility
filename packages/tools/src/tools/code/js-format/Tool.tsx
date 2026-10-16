import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, NumberInput, OptionsBar, Select, TextTransform } from '@/ui';
import { DEFAULT_JS_OPTIONS, formatJs, type JsFormatOptions } from './logic';

export default function JsFormat({ initialInput }: ToolProps) {
  const [o, setO] = useState<JsFormatOptions>(DEFAULT_JS_OPTIONS);
  const set = <K extends keyof JsFormatOptions>(k: K) => (v: JsFormatOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(
    () => [{ id: 'format', label: 'Format', run: (s: string) => formatJs(s, o), inputLanguage: o.language, filename: o.language === 'typescript' ? 'formatted.ts' : 'formatted.js' }],
    [o],
  );
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
              { value: 'javascript', label: 'JavaScript / JSX' },
              { value: 'typescript', label: 'TypeScript' },
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
          <NumberInput label="Line width" value={o.printWidth} onChange={set('printWidth')} min={20} max={200} />
          <Select
            label="Trailing commas"
            value={o.trailingComma}
            onChange={set('trailingComma')}
            options={[
              { value: 'all', label: 'All' },
              { value: 'es5', label: 'ES5' },
              { value: 'none', label: 'None' },
            ]}
          />
          <Checkbox label="Semicolons" checked={o.semi} onChange={set('semi')} />
          <Checkbox label="Single quotes" checked={o.singleQuote} onChange={set('singleQuote')} />
        </OptionsBar>
      }
    />
  );
}
