import { useMemo, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, Checkbox, CodeEditor, ErrorBox, OptionsBar, PaneTitle, useToolMeta } from '@/ui';
import { markdownStats, renderPreview } from './logic';

// The theme has no typography plugin, so style the rendered elements here.
const PROSE = [
  'max-w-none break-words text-sm leading-relaxed',
  '[&_h1]:mt-4 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:pb-1 [&_h1]:text-2xl [&_h1]:font-semibold',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:pb-1 [&_h2]:text-xl [&_h2]:font-semibold',
  '[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:font-semibold',
  '[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_a]:text-brand [&_a]:underline [&_hr]:my-4',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_table]:my-3 [&_table]:border-collapse [&_th]:border [&_th]:px-3 [&_th]:py-1 [&_td]:border [&_td]:px-3 [&_td]:py-1 [&_th]:bg-muted',
  '[&_img]:max-w-full [&_.blocked-image]:rounded [&_.blocked-image]:bg-muted [&_.blocked-image]:px-1 [&_.blocked-image]:text-muted-foreground',
].join(' ');

export default function MarkdownPreview({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const [gfm, setGfm] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const result = useMemo(() => {
    try {
      return { html: renderPreview(input, { gfm, breaks }), error: null as string | null };
    } catch (e) {
      return { html: '', error: e instanceof ToolError || e instanceof Error ? e.message : String(e) };
    }
  }, [input, gfm, breaks]);
  const stats = markdownStats(input);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        {meta?.example && (
          <Button variant="ghost" onClick={() => setInput(meta.example!.input)}>
            Sample
          </Button>
        )}
        <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
          Clear
        </Button>
      </div>
      <OptionsBar>
        <Checkbox label="GitHub-flavoured" checked={gfm} onChange={setGfm} />
        <Checkbox label="Line breaks become <br>" checked={breaks} onChange={setBreaks} />
      </OptionsBar>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>Markdown</PaneTitle>
          <CodeEditor value={input} onChange={setInput} language="markdown" label="Tool input" testId="tool-input" placeholder="# Write Markdown here…" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Preview</PaneTitle>
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {stats.words} words · {stats.characters} characters
            </span>
          </div>
          <ErrorBox error={result.error} />
          {/* The HTML is sanitised by DOMPurify in renderPreview. */}
          <div
            className={`min-h-72 overflow-auto rounded-lg border bg-card p-4 ${PROSE}`}
            data-testid="tool-output"
            aria-label="Markdown preview"
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        </section>
      </div>
    </div>
  );
}
