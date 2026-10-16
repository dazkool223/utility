import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, TextTransform } from '@/ui';
import { DEFAULT_MD_HTML, mdToHtml, type MdHtmlOptions } from './logic';

export default function MarkdownHtml({ initialInput }: ToolProps) {
  const [o, setO] = useState<MdHtmlOptions>(DEFAULT_MD_HTML);
  const set = <K extends keyof MdHtmlOptions>(k: K) => (v: MdHtmlOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const modes = useMemo(
    () => [{ id: 'convert', label: 'Convert', run: (s: string) => mdToHtml(s, o), inputLanguage: 'markdown' as const, outputLanguage: 'html' as const, filename: 'output.html' }],
    [o],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="GitHub-flavoured (tables, task lists)" checked={o.gfm} onChange={set('gfm')} />
          <Checkbox label="Line breaks become <br>" checked={o.breaks} onChange={set('breaks')} />
          <Checkbox label="Sanitise (remove scripts and handlers)" checked={o.sanitize} onChange={set('sanitize')} />
        </OptionsBar>
      }
    />
  );
}
