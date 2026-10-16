import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextTransform } from '@/ui';
import { DEFAULT_CSS_MINIFY, minifyCss, type CssMinifyOptions } from './logic';

export default function CssMinify({ initialInput }: ToolProps) {
  const [o, setO] = useState<CssMinifyOptions>(DEFAULT_CSS_MINIFY);
  const set = <K extends keyof CssMinifyOptions>(k: K) => (v: CssMinifyOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(() => [{ id: 'minify', label: 'Minify', run: (s: string) => minifyCss(s, o), inputLanguage: 'css' as const, filename: 'styles.min.css' }], [o]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Merge and reorder rules (smaller, may change cascade)" checked={o.restructure} onChange={set('restructure')} />
          <Checkbox label="Keep /*! licence comments */" checked={o.keepBangComments} onChange={set('keepBangComments')} />
        </OptionsBar>
      }
    />
  );
}
