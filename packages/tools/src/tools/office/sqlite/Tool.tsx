import { useCallback, useEffect, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { BusyLine, Button, CodeEditor, CopyButton, ErrorBox, FileDrop, FileList, PaneTitle, downloadBlob, useRunShortcut, useWorker } from '@/ui';
import { ROW_LIMIT, describeCell, selectAllSql, type QueryResult, type SchemaObject } from './logic';

function messageOf(e: unknown, fallback: string): string {
  // Errors thrown in the worker lose their class but keep their name.
  return e instanceof Error && e.name === 'ToolError' ? e.message : fallback;
}

function toCsvText(result: QueryResult): string {
  const esc = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [result.columns, ...result.rows.map((r) => r.map((c) => (c === null ? '' : describeCell(c))))].map((r) => r.map((c) => esc(String(c))).join(',')).join('\n');
}

export default function SqliteBrowser({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [schema, setSchema] = useState<SchemaObject[] | null>(null);
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modified, setModified] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const execute = useCallback(
    async (text: string) => {
      setBusy(true);
      setError(null);
      try {
        const r = await api().query(text, ROW_LIMIT);
        setResult(r.result);
        if (r.result.changes !== null) {
          setModified(true);
          setSchema(r.schema);
        }
      } catch (e) {
        setResult(null);
        setError(messageOf(e, 'The query could not be run.'));
      } finally {
        setBusy(false);
      }
    },
    [api],
  );

  useEffect(() => {
    setSchema(null);
    setResult(null);
    setError(null);
    setModified(false);
    setSelected(null);
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const objects = await api().open(await file.arrayBuffer());
        if (cancelled) return;
        setSchema(objects);
        const first = objects.find((o) => o.kind === 'table') ?? objects[0];
        if (first) {
          setSelected(first.name);
          const text = selectAllSql(first.name);
          setSql(text);
          await execute(text);
        } else {
          setSql('');
        }
      } catch (e) {
        if (!cancelled) setError(messageOf(e, 'The database could not be opened.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, api, execute]);

  const run = useCallback(() => void execute(sql), [execute, sql]);
  useRunShortcut(run);

  const current = schema?.find((s) => s.name === selected) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="binary" accept=".sqlite,.sqlite3,.db,.db3,application/vnd.sqlite3,application/x-sqlite3" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a SQLite database (.sqlite, .db) here" />
      ) : (
        <FileList files={[file]} onRemove={() => setFile(null)} />
      )}
      {file && (
        <>
          <ErrorBox error={schema === null ? error : null} />
          {schema && (
            <div className="grid gap-3 lg:grid-cols-[16rem_1fr]">
              <aside className="flex min-w-0 flex-col gap-2" aria-label="Tables and views">
                <PaneTitle>Tables</PaneTitle>
                {schema.length === 0 && <p className="text-sm text-muted-foreground">This database has no tables.</p>}
                <ul className="flex flex-col gap-1" data-testid="schema-list">
                  {schema.map((o) => (
                    <li key={o.name}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-sm hover:bg-accent ${selected === o.name ? 'border-brand bg-accent' : 'bg-card'}`}
                        onClick={() => {
                          setSelected(o.name);
                          const text = selectAllSql(o.name);
                          setSql(text);
                          void execute(text);
                        }}
                      >
                        <span className="truncate">{o.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{o.kind === 'view' ? 'view' : `${o.rows?.toLocaleString() ?? '?'} rows`}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {current && (
                  <div className="rounded-lg border bg-card p-2 text-xs" data-testid="schema-columns">
                    <p className="mb-1 font-medium">{current.name}</p>
                    <ul className="flex flex-col gap-0.5 font-mono">
                      {current.columns.map((c) => (
                        <li key={c.name} className="flex justify-between gap-2">
                          <span className="truncate">
                            {c.name}
                            {c.primaryKey ? ' (PK)' : ''}
                          </span>
                          <span className="text-muted-foreground">
                            {c.type || 'any'}
                            {c.notNull ? ' NOT NULL' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
              <div className="flex min-w-0 flex-col gap-3">
                <section className="flex flex-col gap-2">
                  <div className="flex min-h-8 items-center gap-2">
                    <PaneTitle>SQL</PaneTitle>
                    <span className="flex-1" />
                    {modified && (
                      <Button
                        onClick={async () => downloadBlob(new Blob([(await api().exportDb()) as BlobPart], { type: 'application/vnd.sqlite3' }), file.name.replace(/(\.[^.]+)?$/, '-modified$1'), 'application/vnd.sqlite3')}
                      >
                        Download modified database
                      </Button>
                    )}
                    <Button variant="primary" onClick={run} disabled={busy} testId="run">
                      {busy ? 'Running…' : 'Run (Ctrl+Enter)'}
                    </Button>
                  </div>
                  <BusyLine busy={busy} label="Running query…" />
                  <CodeEditor value={sql} onChange={setSql} language="sql" label="SQL query" testId="tool-input" className="min-h-28" placeholder="SELECT * FROM my_table LIMIT 100;" />
                </section>
                <ErrorBox error={error} />
                <section className="flex min-w-0 flex-col gap-2">
                  <div className="flex min-h-8 items-center gap-2">
                    <PaneTitle>Result</PaneTitle>
                    {result && (
                      <span className="text-sm text-muted-foreground">
                        {result.columns.length
                          ? `${result.rows.length.toLocaleString()} rows${result.truncated ? ` (first ${ROW_LIMIT.toLocaleString()} shown)` : ''} · ${result.millis} ms`
                          : `${result.changes ?? 0} rows changed · ${result.millis} ms`}
                      </span>
                    )}
                    <span className="flex-1" />
                    {result && result.columns.length > 0 && <CopyButton text={toCsvText(result)} label="Copy as CSV" />}
                  </div>
                  <div className="max-h-[28rem] overflow-auto rounded-lg border bg-card" data-testid="tool-output">
                    {result && result.columns.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                          <tr>
                            {result.columns.map((c, i) => (
                              <th key={i} className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, r) => (
                            <tr key={r} className="border-t">
                              {row.map((cell, c) => (
                                <td key={c} className={`px-3 py-1.5 font-mono whitespace-nowrap ${cell === null || typeof cell === 'object' ? 'text-muted-foreground italic' : ''}`}>
                                  {describeCell(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="px-3 py-4 text-sm text-muted-foreground">{result ? 'The statement ran and returned no rows.' : 'Query results appear here.'}</p>
                    )}
                  </div>
                  {file && <p className="text-xs text-muted-foreground">{formatBytes(file.size)} database, loaded into memory.</p>}
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
