import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ToolError } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, KeyValueTable, PaneTitle, type EditorLanguage } from '@/ui';
import { useToolMeta } from '@/ui';

export type Row = [string, ReactNode];

/** Standard decoder/inspector layout: Tool Input editor on the left, key/value table on the right. */
export function DecoderTool({
  decode,
  initialInput = '',
  options,
  language = 'text',
  placeholder,
  deps = [],
  copyText: toText,
}: {
  decode: (input: string) => Row[] | Promise<Row[]>;
  initialInput?: string;
  options?: ReactNode | ((api: { input: string; setInput: (s: string) => void }) => ReactNode);
  language?: EditorLanguage;
  placeholder?: string;
  /** Extra values that re-trigger decoding (option state). */
  deps?: unknown[];
  /** Plain-text version of the rows for the Copy button; defaults to string cells joined as `key: value`. */
  copyText?: (rows: Row[]) => string;
}) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);

  useEffect(() => {
    const id = ++req.current;
    if (!input.trim()) {
      setRows([]);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await decode(input);
        if (id !== req.current) return;
        setRows(r);
        setError(null);
      } catch (e) {
        if (id !== req.current) return;
        setRows([]);
        setError(e instanceof ToolError || e instanceof Error ? e.message : String(e));
      }
    }, input.length > 50_000 ? 150 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- decode is re-created each render; deps lists option state
  }, [input, ...deps]);

  const text = toText ? toText(rows) : rows.map(([k, v]) => `${k}: ${typeof v === 'string' || typeof v === 'number' ? v : ''}`).join('\n');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
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
      {typeof options === 'function' ? options({ input, setInput }) : options}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center">
            <PaneTitle>Input</PaneTitle>
          </div>
          <CodeEditor value={input} onChange={setInput} language={language} label="Tool input" testId="tool-input" placeholder={placeholder ?? 'Paste here…'} />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Result</PaneTitle>
            <span className="flex-1" />
            <CopyButton text={text} primary />
          </div>
          <ErrorBox error={error} />
          {rows.length > 0 && <KeyValueTable rows={rows} />}
        </section>
      </div>
    </div>
  );
}
