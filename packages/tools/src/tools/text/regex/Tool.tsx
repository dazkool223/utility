import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, Checkbox, CodeEditor, CopyButton, ErrorBox, OptionsBar, PaneTitle, RestrictionNotice, TextInput, useRunShortcut, useToolMeta } from '@/ui';
import { FLAGS, type RegexMatch, type RegexResult } from './logic';
import type { WorkerRequest, WorkerResponse } from './worker';

const TIMEOUT_MS = 2000;
const SHOW_LIMIT = 100_000;
const MATCH_LIMIT = 1000;

/** Owns one matching Worker. A request that outlives the timeout kills the Worker so the page never freezes. */
function useRegexWorker() {
  const worker = useRef<Worker | null>(null);
  const next = useRef(0);
  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );
  return useCallback((req: Omit<WorkerRequest, 'id'>) => {
    return new Promise<RegexResult>((resolve, reject) => {
      if (!worker.current) worker.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      const w = worker.current;
      const id = ++next.current;
      const timer = setTimeout(() => {
        w.terminate();
        if (worker.current === w) worker.current = null;
        reject(new Error(`This pattern took longer than ${TIMEOUT_MS / 1000} seconds, so it was stopped. It probably backtracks catastrophically (for example nested quantifiers like (a+)+). Simplify the pattern.`));
      }, TIMEOUT_MS);
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id !== id) return;
        clearTimeout(timer);
        w.removeEventListener('message', onMessage);
        if (e.data.ok) resolve(e.data.result);
        else reject(new Error(e.data.message));
      };
      w.addEventListener('message', onMessage);
      w.postMessage({ ...req, id } satisfies WorkerRequest);
    });
  }, []);
}

function Highlighted({ text, matches }: { text: string; matches: RegexMatch[] }) {
  const shown = text.slice(0, SHOW_LIMIT);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index >= shown.length) return;
    if (m.index > pos) parts.push(shown.slice(pos, m.index));
    if (m.end > m.index) {
      parts.push(
        <mark key={i} className="rounded-sm bg-brand/25 text-foreground">
          {shown.slice(m.index, Math.min(m.end, shown.length))}
        </mark>,
      );
    }
    pos = Math.max(pos, Math.min(m.end, shown.length));
  });
  if (pos < shown.length) parts.push(shown.slice(pos));
  return (
    <pre className="m-0 max-h-60 overflow-auto rounded-lg border bg-card p-3 font-mono text-sm break-words whitespace-pre-wrap" aria-label="Text with matches highlighted">
      {parts}
      {text.length > SHOW_LIMIT && '…'}
    </pre>
  );
}

export default function RegexTester({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const runWorker = useRegexWorker();
  const [pattern, setPattern] = useState('\\d+');
  const [flags, setFlags] = useState('g');
  const [replacement, setReplacement] = useState('');
  const [text, setText] = useState(initialInput);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const req = useRef(0);

  const execute = useCallback(async () => {
    const id = ++req.current;
    if (!pattern) {
      setResult(null);
      setError(null);
      return;
    }
    setBusy(true);
    try {
      const r = await runWorker({ pattern, flags, text, replacement, limit: MATCH_LIMIT });
      if (id !== req.current) return;
      setResult(r);
      setError(null);
    } catch (e) {
      if (id !== req.current) return;
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === req.current) setBusy(false);
    }
  }, [pattern, flags, text, replacement, runWorker]);

  useEffect(() => {
    const t = setTimeout(() => void execute(), text.length > 50_000 ? 250 : 60);
    return () => clearTimeout(t);
  }, [execute, text.length]);
  useRunShortcut(() => void execute());

  const toggleFlag = (f: string, on: boolean) => setFlags((cur) => (on ? (cur.includes(f) ? cur : cur + f) : cur.replace(f, '')));
  const summary = result ? `${result.matches.length}${result.truncated ? '+' : ''} match${result.matches.length === 1 ? '' : 'es'}` : '';
  const report = result
    ? result.matches.map((m, i) => `#${i + 1} [${m.index}-${m.end}] ${m.match}${m.groups.length ? ' | groups: ' + m.groups.map((g) => g ?? '(unset)').join(', ') : ''}`).join('\n')
    : '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        {meta?.example && (
          <Button variant="ghost" onClick={() => setText(meta.example!.input)}>
            Sample
          </Button>
        )}
        <Button variant="ghost" onClick={() => setText('')} disabled={!text}>
          Clear
        </Button>
      </div>
      <OptionsBar>
        <TextInput label="Pattern" value={pattern} onChange={setPattern} monospace testId="regex-pattern" className="w-80 max-w-full" placeholder="(\w+)@(\w+)\.com" />
        <TextInput label="Replace with (optional)" value={replacement} onChange={setReplacement} monospace testId="regex-replacement" className="w-56 max-w-full" placeholder="$1 at $2" />
        {FLAGS.map((f) => (
          <span key={f.flag} title={f.title}>
            <Checkbox label={`${f.label} (${f.title.split(':')[0]!.toLowerCase()})`} checked={flags.includes(f.flag)} onChange={(on) => toggleFlag(f.flag, on)} />
          </span>
        ))}
      </OptionsBar>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>Test text</PaneTitle>
          <CodeEditor value={text} onChange={setText} label="Tool input" testId="tool-input" placeholder="Paste the text to search…" />
        </section>
        <section className="flex min-w-0 flex-col gap-2" aria-busy={busy}>
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Matches {summary && `(${summary})`}</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={result?.replaced ?? report} label={result?.replaced != null ? 'Copy replaced text' : 'Copy matches'} />
          </div>
          <ErrorBox error={error} />
          <div className="flex max-h-[62vh] min-h-72 flex-col gap-3 overflow-auto" data-testid="tool-output">
            {result && (
              <>
                {result.truncated && <RestrictionNotice>Only the first {MATCH_LIMIT} matches are shown.</RestrictionNotice>}
                <Highlighted text={text} matches={result.matches} />
                {result.matches.length === 0 && <p className="m-0 text-sm text-muted-foreground">No matches.</p>}
                {result.matches.length > 0 && (
                  <div className="overflow-hidden rounded-lg border bg-card">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="px-3 py-1.5 font-normal">#</th>
                          <th className="px-3 py-1.5 font-normal">Position</th>
                          <th className="px-3 py-1.5 font-normal">Match and groups</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.matches.map((m, i) => (
                          <tr key={i} className="border-b align-top last:border-0">
                            <td className="px-3 py-1.5">{i + 1}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              {m.index}-{m.end}
                            </td>
                            <td className="px-3 py-1.5 font-mono break-all">
                              <div>{m.match === '' ? '(empty match)' : m.match}</div>
                              {m.groups.map((g, gi) => (
                                <div key={gi} className="text-muted-foreground">
                                  ${gi + 1}: {g === undefined ? '(not matched)' : g}
                                </div>
                              ))}
                              {Object.entries(m.named).map(([k, v]) => (
                                <div key={k} className="text-muted-foreground">
                                  {k}: {v === undefined ? '(not matched)' : v}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {result.replaced !== null && (
                  <section className="flex flex-col gap-1">
                    <PaneTitle>After replacement</PaneTitle>
                    <pre className="m-0 max-h-60 overflow-auto rounded-lg border bg-card p-3 font-mono text-sm break-words whitespace-pre-wrap" data-testid="regex-replaced">
                      {result.replaced}
                    </pre>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
