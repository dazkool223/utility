import { useEffect, useMemo, useRef, useState } from 'react';
import { proxy } from 'comlink';
import type { ToolProps } from '@/core/types';
import { Checkbox, CodeEditor, CopyButton, DownloadButton, ErrorBox, FileDrop, FileList, NumberInput, OptionsBar, PaneTitle, useWorker } from '@/ui';
import { formatStrings, type FoundString, type StringEncoding, type StringsOptions } from './logic';

export default function StringsExtract({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [minLength, setMinLength] = useState(4);
  const [encodings, setEncodings] = useState<StringEncoding[]>(['ascii', 'utf16le']);
  const [offsets, setOffsets] = useState(true);
  const [result, setResult] = useState<{ strings: FoundString[]; truncated: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);

  useEffect(() => {
    if (!file) return;
    const id = ++run.current;
    const options: StringsOptions = { minLength, encodings, maxResults: 100_000 };
    setBusy(true);
    setResult(null);
    setError(null);
    setProgress(0);
    api()
      .extract(file, options, proxy((f: number) => id === run.current && setProgress(f)))
      .then((r) => id === run.current && setResult(r))
      .catch((e) => id === run.current && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => id === run.current && setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, minLength, encodings.join(',')]);

  const text = useMemo(() => (result ? formatStrings(result.strings, offsets) : ''), [result, offsets]);
  const toggle = (enc: StringEncoding) => (on: boolean) => setEncodings((list) => (on ? [...list, enc] : list.filter((e) => e !== enc)));

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="binary" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a file to extract its strings" />
      {file && <FileList files={[file]} />}
      <OptionsBar>
        <NumberInput label="Minimum length" value={minLength} onChange={setMinLength} min={1} max={1000} />
        <Checkbox label="ASCII" checked={encodings.includes('ascii')} onChange={toggle('ascii')} />
        <Checkbox label="UTF-16 little-endian" checked={encodings.includes('utf16le')} onChange={toggle('utf16le')} />
        <Checkbox label="UTF-16 big-endian" checked={encodings.includes('utf16be')} onChange={toggle('utf16be')} />
        <Checkbox label="Show offsets" checked={offsets} onChange={setOffsets} />
      </OptionsBar>
      {busy && (
        <div className="flex items-center gap-3 text-sm" role="status">
          <progress className="h-2 w-64" value={progress} max={1} aria-label="Scanning progress" />
          {Math.round(progress * 100)}%
        </div>
      )}
      <ErrorBox error={encodings.length === 0 ? 'Choose at least one encoding to search for.' : error} />
      {result && (
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Strings ({result.strings.length.toLocaleString()})</PaneTitle>
            <span className="flex-1" />
            <DownloadButton data={text || null} filename="strings.txt" />
            <CopyButton primary text={text} />
          </div>
          {result.truncated && <p className="m-0 text-sm text-muted-foreground">Showing the first 100,000 strings. Raise the minimum length to see fewer.</p>}
          <CodeEditor value={text} readOnly label="Tool output" testId="tool-output" placeholder="No strings found." />
        </section>
      )}
    </div>
  );
}
