import { useEffect, useRef, useState } from 'react';
import { proxy } from 'comlink';
import type { ToolProps } from '@/core/types';
import { Checkbox, CopyButton, ErrorBox, FileDrop, FileList, KeyValueTable, OptionsBar, PaneTitle, TextInput, useWorker } from '@/ui';
import { FILE_ALGOS, normaliseChecksum } from './logic';

export default function FileChecksumTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [selected, setSelected] = useState<string[]>(['md5', 'sha1', 'sha256', 'sha512']);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expected, setExpected] = useState('');
  const run = useRef(0);

  useEffect(() => {
    if (!file) return;
    const id = ++run.current;
    setBusy(true);
    setResults(null);
    setError(null);
    setProgress(0);
    api()
      .hashFile(file, selected, proxy((f: number) => id === run.current && setProgress(f)))
      .then((r) => id === run.current && setResults(r))
      .catch((e) => id === run.current && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => id === run.current && setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, selected.join(',')]);

  const want = normaliseChecksum(expected);
  const matched = want && results ? Object.entries(results).find(([, v]) => v === want)?.[0] : undefined;
  const rows: Array<[string, string]> = results ? FILE_ALGOS.filter(([id]) => id in results).map(([id, label]) => [label, results[id]!]) : [];

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="binary" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a file to checksum (any size)" />
      {file && <FileList files={[file]} />}
      <OptionsBar>
        {FILE_ALGOS.map(([id, label]) => (
          <Checkbox key={id} label={label} checked={selected.includes(id)} onChange={(on) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)))} />
        ))}
      </OptionsBar>
      {busy && (
        <div className="flex items-center gap-3 text-sm" role="status">
          <progress className="h-2 w-64" value={progress} max={1} aria-label="Hashing progress" />
          {Math.round(progress * 100)}%
        </div>
      )}
      <ErrorBox error={error} />
      {rows.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaneTitle>Checksums</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={rows.map(([l, v]) => `${l}: ${v}`).join('\n')} />
          </div>
          <KeyValueTable rows={rows} />
          <div className="flex flex-wrap items-end gap-3">
            <TextInput label="Compare with an expected checksum" value={expected} onChange={setExpected} monospace className="w-96" testId="expected-checksum" />
            {want && (
              <p className="m-0 pb-1.5 text-sm" data-testid="checksum-match" role="status">
                {matched ? `Match (${FILE_ALGOS.find(([i]) => i === matched)?.[1]})` : 'No match with any selected algorithm'}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
