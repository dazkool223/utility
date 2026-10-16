import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, KeyValueTable, PaneTitle, SendTo, useToolMeta } from '@/ui';
import { describeUserAgent, parseUserAgent, uaRows, userAgentJson } from './logic';

export default function UserAgentParser({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const result = useMemo(() => {
    if (!input.trim()) return { rows: null as Array<[string, string]> | null, error: null as string | null };
    try {
      return { rows: uaRows(parseUserAgent(input)), error: null };
    } catch (e) {
      return { rows: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        <Button variant="ghost" onClick={() => setInput(navigator.userAgent)}>
          Use my browser
        </Button>
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
          <PaneTitle>User-Agent</PaneTitle>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="Mozilla/5.0 (…) …" className="min-h-40" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Result</PaneTitle>
            <span className="flex-1" />
            {result.rows && <SendTo text={userAgentJson(input)} />}
            {result.rows && <CopyButton primary text={describeUserAgent(input)} />}
          </div>
          <ErrorBox error={result.error} />
          {result.rows && <KeyValueTable rows={result.rows} />}
        </section>
      </div>
    </div>
  );
}
