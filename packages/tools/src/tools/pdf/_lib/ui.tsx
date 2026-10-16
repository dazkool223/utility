import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { DownloadButton, Field, PaneTitle } from '@/ui';
import { Input } from '@/ui/shadcn/input';
import { errorMessage } from './files';

/** Runs one async job at a time and keeps busy / error / result state. A newer run supersedes an older one. */
export function useTask<T>() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const token = useRef(0);
  useEffect(
    () => () => {
      token.current++;
    },
    [],
  );
  const run = useCallback(async (job: () => Promise<T>) => {
    const mine = ++token.current;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = await job();
      if (mine === token.current) setResult(out);
    } catch (e) {
      if (mine === token.current) setError(errorMessage(e));
    } finally {
      if (mine === token.current) setBusy(false);
    }
  }, []);
  const reset = useCallback(() => {
    token.current++;
    setBusy(false);
    setError(null);
    setResult(null);
  }, []);
  return { busy, error, result, run, reset };
}

/** The Tool Output of a file Tool: a summary line and a download button. */
export function FileResult({ blob, filename, summary, children }: { blob: Blob; filename: string; summary: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
      <PaneTitle>Result</PaneTitle>
      <p className="m-0 text-sm" data-testid="result-summary">
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DownloadButton data={blob} filename={filename} type={blob.type} label={`Download ${filename}`} />
      </div>
      {children}
    </section>
  );
}

export { BusyLine } from '@/ui';

/** Masked text field. The value is held in component state only. */
export function PasswordField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type={show ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            className="h-8 w-56"
            value={value}
            data-testid={testId}
            onChange={(e) => onChange(e.target.value)}
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show
          </label>
        </div>
      )}
    </Field>
  );
}

export async function readFile(file: Blob): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
