import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Segmented, Select, useWorker } from '@/ui';
import { TwoInputTool } from '../_lib/TwoInputTool';
import { toRows, type DiffGranularity, type DiffStats, type Part } from './logic';

const SAMPLE = { a: 'The quick brown fox\njumps over\nthe lazy dog\nsame ending', b: 'The quick red fox\njumps over\nthe very lazy dog\nsame ending\na new line' };
const ROW_LIMIT = 5000;

const ADDED = 'bg-brand/10';
const REMOVED = 'bg-destructive/10 text-destructive';

function InlineView({ parts, granularity }: { parts: Part[]; granularity: DiffGranularity }) {
  if (granularity !== 'lines') {
    return (
      <pre className="m-0 font-mono text-sm whitespace-pre-wrap break-words">
        {parts.map((p, i) => (
          <span key={i} className={p.added ? ADDED : p.removed ? `${REMOVED} line-through` : undefined}>
            {p.value}
          </span>
        ))}
      </pre>
    );
  }
  const rows: Array<{ text: string; kind: 'same' | 'added' | 'removed' }> = [];
  for (const p of parts) {
    const lines = p.value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    for (const l of lines) rows.push({ text: l, kind: p.added ? 'added' : p.removed ? 'removed' : 'same' });
  }
  return (
    <div className="font-mono text-sm">
      {rows.slice(0, ROW_LIMIT).map((r, i) => (
        <div key={i} className={`flex gap-2 px-1 ${r.kind === 'added' ? ADDED : r.kind === 'removed' ? REMOVED : ''}`}>
          <span className="w-3 shrink-0 select-none text-muted-foreground">{r.kind === 'added' ? '+' : r.kind === 'removed' ? '-' : ' '}</span>
          <span className="break-all whitespace-pre-wrap">{r.text || ' '}</span>
        </div>
      ))}
      {rows.length > ROW_LIMIT && <p className="text-muted-foreground">Showing the first {ROW_LIMIT} of {rows.length} lines. Copy gives the full patch.</p>}
    </div>
  );
}

function SideBySideView({ parts }: { parts: Part[] }) {
  const rows = toRows(parts);
  return (
    <div className="font-mono text-sm">
      <div className="grid grid-cols-2 gap-px bg-border">
        {rows.slice(0, ROW_LIMIT).map((r, i) => (
          <div key={i} className="contents">
            <div className={`bg-card px-1 break-all whitespace-pre-wrap ${r.kind === 'removed' || r.kind === 'changed' ? REMOVED : ''}`}>{r.left ?? ' '}</div>
            <div className={`bg-card px-1 break-all whitespace-pre-wrap ${r.kind === 'added' || r.kind === 'changed' ? ADDED : ''}`}>{r.right ?? ' '}</div>
          </div>
        ))}
      </div>
      {rows.length > ROW_LIMIT && <p className="text-muted-foreground">Showing the first {ROW_LIMIT} of {rows.length} rows.</p>}
    </div>
  );
}

export default function TextDiff({ initialInput }: ToolProps) {
  const [granularity, setGranularity] = useState<DiffGranularity>('lines');
  const [layout, setLayout] = useState<'inline' | 'side'>('inline');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));

  const compute = async (a: string, b: string) => {
    const { parts, stats, patch } = (await api().diff(a, b, { granularity, ignoreCase, ignoreWhitespace })) as { parts: Part[]; stats: DiffStats; patch: string };
    const unit = granularity === 'lines' ? 'lines' : granularity === 'words' ? 'words' : 'characters';
    const identical = stats.added === 0 && stats.removed === 0;
    return {
      text: granularity === 'lines' ? patch : parts.map((p) => (p.added ? `[+${p.value}+]` : p.removed ? `[-${p.value}-]` : p.value)).join(''),
      view: (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs text-muted-foreground" data-testid="diff-summary">
            {identical ? 'No differences' : `${stats.added} ${unit} added, ${stats.removed} ${unit} removed, ${stats.unchanged} unchanged`}
          </p>
          {layout === 'side' && granularity === 'lines' ? <SideBySideView parts={parts} /> : <InlineView parts={parts} granularity={granularity} />}
        </div>
      ),
    };
  };

  return (
    <TwoInputTool
      labelA="Original text"
      labelB="Changed text"
      compute={compute}
      deps={[granularity, layout, ignoreCase, ignoreWhitespace]}
      initialInput={initialInput}
      sample={SAMPLE}
      filename="diff.patch"
      options={
        <OptionsBar>
          <Select
            label="Compare by"
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: 'lines', label: 'Lines' },
              { value: 'words', label: 'Words' },
              { value: 'chars', label: 'Characters' },
            ]}
          />
          <Segmented
            label="Layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'inline', label: 'Inline' },
              { value: 'side', label: 'Side by side' },
            ]}
          />
          <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
          {granularity === 'lines' && <Checkbox label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />}
        </OptionsBar>
      }
    />
  );
}
