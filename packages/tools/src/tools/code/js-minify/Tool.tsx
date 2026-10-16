import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { DEFAULT_JS_MINIFY, minifyJs, type JsMinifyOptions } from './logic';

export default function JsMinify({ initialInput }: ToolProps) {
  const [o, setO] = useState<JsMinifyOptions>(DEFAULT_JS_MINIFY);
  const set = <K extends keyof JsMinifyOptions>(k: K) => (v: JsMinifyOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(() => [{ id: 'minify', label: 'Minify', run: (s: string) => minifyJs(s, o), inputLanguage: 'javascript' as const, filename: 'script.min.js' }], [o]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Shorten names" checked={o.mangle} onChange={set('mangle')} />
          <Checkbox label="Compress code" checked={o.compress} onChange={set('compress')} />
          <Checkbox label="ES module" checked={o.module} onChange={set('module')} />
          <Select
            label="Comments"
            value={o.keepComments}
            onChange={set('keepComments')}
            options={[
              { value: 'none', label: 'Remove all' },
              { value: 'license', label: 'Keep licence comments' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
