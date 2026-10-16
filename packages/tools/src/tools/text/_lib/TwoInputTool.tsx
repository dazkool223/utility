import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ToolError } from '@/core/types';
import { Button, CodeEditor, CopyButton, DownloadButton, ErrorBox, PaneTitle, useRunShortcut, useToolMeta, type EditorLanguage } from '@/ui';

export type TwoInputResult = string | { text: string; view: ReactNode };

export interface TwoInputToolProps {
  labelA: string;
  labelB: string;
  languageA?: EditorLanguage;
  languageB?: EditorLanguage;
  /** Throws ToolError for invalid input. Called whenever either input or the options change (via `deps`). */
  compute: (a: string, b: string) => TwoInputResult | Promise<TwoInputResult>;
  /** Values the computation depends on besides the inputs; a change re-runs it. */
  deps?: ReadonlyArray<unknown>;
  initialInput?: string;
  options?: ReactNode;
  outputLanguage?: EditorLanguage;
  filename?: string;
  /** Fills both editors when "Sample" is pressed. */
  sample?: { a: string; b: string };
  /** Compute even when both inputs are empty (default false). */
  runWhenEmpty?: boolean;
}

/** Two Tool Inputs (A and B) and one Tool Output. Input A has data-testid="tool-input", B has "tool-input-2". */
export function TwoInputTool({ labelA, labelB, languageA, languageB, compute, deps = [], initialInput = '', options, outputLanguage, filename = 'output.txt', sample, runWhenEmpty }: TwoInputToolProps) {
  const meta = useToolMeta();
  const [a, setA] = useState(initialInput);
  const [b, setB] = useState('');
  const [result, setResult] = useState<TwoInputResult>('');
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);
  const computeRef = useRef(compute);
  computeRef.current = compute;

  const run = async () => {
    const id = ++req.current;
    if (!a && !b && !runWhenEmpty) {
      setResult('');
      setError(null);
      return;
    }
    try {
      const r = await computeRef.current(a, b);
      if (id !== req.current) return;
      setResult(r);
      setError(null);
    } catch (e) {
      if (id !== req.current) return;
      setResult('');
      setError(e instanceof ToolError || e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    const t = setTimeout(() => void run(), a.length + b.length > 200_000 ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on inputs and caller-declared deps only
  }, [a, b, ...deps]);
  useRunShortcut(() => void run());

  const text = typeof result === 'string' ? result : result.text;
  const sampleToUse = sample ?? (meta?.example ? { a: meta.example.input, b: '' } : undefined);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        {sampleToUse && (
          <Button
            variant="ghost"
            onClick={() => {
              setA(sampleToUse.a);
              setB(sampleToUse.b);
            }}
          >
            Sample
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setA('');
            setB('');
          }}
          disabled={!a && !b}
        >
          Clear
        </Button>
      </div>
      {options}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>{labelA}</PaneTitle>
          <CodeEditor value={a} onChange={setA} language={languageA} label={labelA} testId="tool-input" className="h-[30vh] min-h-48" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>{labelB}</PaneTitle>
          <CodeEditor value={b} onChange={setB} language={languageB} label={labelB} testId="tool-input-2" className="h-[30vh] min-h-48" />
        </section>
      </div>
      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <PaneTitle>Output</PaneTitle>
          <span className="flex-1" />
          <DownloadButton data={text || null} filename={filename} />
          <CopyButton text={text} primary />
        </div>
        <ErrorBox error={error} />
        {typeof result !== 'string' ? (
          <div className="max-h-[60vh] overflow-auto rounded-lg border bg-card p-3 font-mono text-sm" data-testid="tool-output">
            {result.view}
          </div>
        ) : (
          <CodeEditor value={result} language={outputLanguage} readOnly label="Tool output" testId="tool-output" className="h-[40vh] min-h-48" />
        )}
      </section>
    </div>
  );
}
