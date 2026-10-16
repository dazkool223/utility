import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, CodeEditor, copyText, ErrorBox, PaneTitle, useToolMeta } from '@/ui';
import { parseJson } from '../format/logic';
import { childPath, describe } from './logic';

function Node({ name, value, path, depth, open }: { name: string; value: unknown; path: string; depth: number; open: boolean | null }) {
  const isContainer = !!value && typeof value === 'object';
  const [expanded, setExpanded] = useState(depth < 2);
  const shown = open ?? expanded;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(path)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };
  const entries = isContainer ? (Array.isArray(value) ? value.map((v, i) => [i, v] as const) : Object.entries(value as object)) : [];
  return (
    <li className="list-none">
      <div className="flex items-center gap-1 rounded px-1 hover:bg-accent">
        {isContainer ? (
          <button type="button" aria-label={shown ? `Collapse ${name}` : `Expand ${name}`} className="inline-flex size-5 items-center justify-center" onClick={() => setExpanded(!shown)}>
            {shown ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="inline-block size-5" />
        )}
        <button type="button" className="cursor-pointer font-semibold" title={`Copy path ${path}`} onClick={() => void copy()}>
          {name}
        </button>
        <span className="text-muted-foreground">:</span>
        <span className={isContainer ? 'text-muted-foreground' : 'break-all'}>{describe(value)}</span>
        {copied && <span className="text-xs text-brand">copied {path}</span>}
      </div>
      {isContainer && shown && (
        <ul className="m-0 ml-4 border-l pl-2">
          {entries.map(([k, v]) => (
            <Node key={String(k)} name={String(k)} value={v} path={childPath(path, k)} depth={depth + 1} open={open} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function JsonTree({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const [open, setOpen] = useState<boolean | null>(null);
  const parsed = useMemo(() => {
    if (!input.trim()) return { value: undefined as unknown, error: null as string | null };
    try {
      return { value: parseJson(input), error: null };
    } catch (e) {
      return { value: undefined, error: e instanceof ToolError ? e.message : String(e) };
    }
  }, [input]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        <Button onClick={() => setOpen(true)}>Expand all</Button>
        <Button onClick={() => setOpen(false)}>Collapse all</Button>
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
          <PaneTitle>Input</PaneTitle>
          <CodeEditor value={input} onChange={setInput} language="json" label="Tool input" testId="tool-input" placeholder="Paste JSON here…" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>Tree (click a name to copy its path)</PaneTitle>
          <ErrorBox error={parsed.error} />
          <div className="h-[60vh] max-h-[70vh] min-h-72 overflow-auto rounded-lg border bg-card p-2 font-mono text-sm" data-testid="tool-output">
            {parsed.value !== undefined && (
              <ul className="m-0 p-0">
                <Node key={String(open)} name="$" value={parsed.value} path="$" depth={0} open={open} />
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
