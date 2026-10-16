import { useMemo, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, KeyValueTable, PaneTitle, SendTo, useToolMeta } from '@/ui';
import { describeUrl, parseUrl, urlRows, urlToJson } from './logic';

export default function UrlParser({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const result = useMemo(() => {
    if (!input.trim()) return { rows: null as Array<[string, string]> | null, error: null as string | null };
    try {
      return { rows: urlRows(parseUrl(input)), error: null };
    } catch (e) {
      return { rows: null, error: e instanceof ToolError || e instanceof Error ? e.message : String(e) };
    }
  }, [input]);
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
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>URL</PaneTitle>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="https://example.com/path?x=1#top" className="min-h-40" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Parts</PaneTitle>
            <span className="flex-1" />
            {result.rows && <SendTo text={urlToJson(input)} />}
            {result.rows && <CopyButton primary text={describeUrl(input)} />}
          </div>
          <ErrorBox error={result.error} />
          {result.rows && <KeyValueTable rows={result.rows} />}
        </section>
      </div>
    </div>
  );
}
