import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { TOOLS } from '@/core/registry';
import type { PipelineStep, ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, DownloadButton, ErrorBox, PaneTitle, SendTo, useRunShortcut } from '@/ui';
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select';
import { loadSteps, runPipeline, type StepResult } from './logic';

export default function PipelineTool({ initialInput = '' }: ToolProps) {
  const [available, setAvailable] = useState<PipelineStep[] | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [input, setInput] = useState(initialInput);
  const [results, setResults] = useState<StepResult[]>([]);

  useEffect(() => {
    void loadSteps(TOOLS).then(setAvailable);
  }, []);

  const run = useCallback(async () => {
    setResults(input ? await runPipeline(input, steps) : []);
  }, [input, steps]);

  useEffect(() => {
    const t = setTimeout(() => void run(), input.length > 1_000_000 ? 400 : 0);
    return () => clearTimeout(t);
  }, [run, input.length]);
  useRunShortcut(useCallback(() => void run(), [run]));

  const move = (i: number, by: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + by]] = [next[i + by]!, next[i]!];
      return next;
    });

  const failed = results.find((r) => r.error);
  const final = !failed && results.length === steps.length ? (results.at(-1)?.output ?? input) : '';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center">
            <PaneTitle>Input</PaneTitle>
          </div>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="Paste the data to transform…" className="h-56" />

          <PaneTitle>Steps</PaneTitle>
          <ol className="flex flex-col gap-2" aria-label="Pipeline steps">
            {steps.map((step, i) => {
              const r = results[i];
              return (
                <li key={`${step.id}-${i}`} className="rounded-lg border bg-card p-2" data-testid="pipeline-step">
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{step.label}</span>
                    <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === steps.length - 1} title="Move down">
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" onClick={() => setSteps((s) => s.filter((_, j) => j !== i))} title="Remove step">
                      <X />
                    </Button>
                  </div>
                  {r?.error && <p className="mt-1 text-xs text-destructive">{r.error}</p>}
                  {r?.output !== undefined && i < steps.length - 1 && (
                    <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted px-2 py-1 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                      {r.output.length > 2000 ? `${r.output.slice(0, 2000)}…` : r.output}
                    </pre>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" />
            <NativeSelect
              size="sm"
              aria-label="Add a step"
              data-testid="add-step"
              value=""
              disabled={!available}
              onChange={(e) => {
                const step = available?.find((s) => s.id === e.target.value);
                if (step) setSteps((s) => [...s, step]);
              }}
            >
              <NativeSelectOption value="">{available ? 'Add a step…' : 'Loading steps…'}</NativeSelectOption>
              {available?.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            <PaneTitle>Output</PaneTitle>
            <span className="flex-1" />
            <SendTo text={final} />
            <DownloadButton data={final || null} filename="output.txt" />
            <CopyButton text={final} primary />
          </div>
          <ErrorBox error={failed ? `Step ${results.indexOf(failed) + 1} failed: ${failed.error}` : null} />
          <CodeEditor value={final} readOnly label="Tool output" testId="tool-output" />
        </section>
      </div>
    </div>
  );
}
