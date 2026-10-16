import { useDeferredValue, useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { sizeRestriction } from '@/core/limits';
import { Button, CodeEditor, CopyButton, PaneTitle, RestrictionNotice, useToolMeta } from '@/ui';
import { statsReport, statsRows, textStats } from './logic';

export default function TextStatsTool({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const deferred = useDeferredValue(input);
  const stats = useMemo(() => textStats(deferred), [deferred]);
  const rows = statsRows(stats);
  const warning = sizeRestriction('text', input.length);
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
      {warning && <RestrictionNotice>{warning}</RestrictionNotice>}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>Input</PaneTitle>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="Paste or type your text…" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Statistics</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={statsReport(deferred)} label="Copy report" />
          </div>
          <div className="overflow-hidden rounded-lg border bg-card" data-testid="tool-output">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0">
                    <th className="w-1/2 px-3 py-2 text-left font-normal text-muted-foreground">{k}</th>
                    <td className="px-3 py-2 font-mono break-words">
                      {/* The plain "Name: value" text is also present for copying and tests. */}
                      <span className="sr-only">{k}: </span>
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
