import { useEffect, useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, FileList, NumberInput, OptionsBar, Segmented, TextInput, useRunShortcut, useWorker } from '@/ui';
import { isPdfFile, plural, stripExtension, errorMessage } from '../_lib/files';
import { BusyLine, FileResult, readFile, useTask } from '../_lib/ui';
import type { SplitMode } from './logic';

const MODES: Array<{ value: SplitMode; label: string }> = [
  { value: 'extract', label: 'Extract pages' },
  { value: 'ranges', label: 'Each range to its own file' },
  { value: 'every', label: 'Every N pages' },
];

export default function SplitTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<SplitMode>('extract');
  const [pages, setPages] = useState('1');
  const [every, setEvery] = useState(1);
  const task = useTask<{ blob: Blob; name: string; summary: string }>();

  useEffect(() => {
    setPageCount(null);
    setLoadError(null);
    task.reset();
    if (!file) return;
    let live = true;
    void (async () => {
      try {
        const buf = await readFile(file);
        const n = await api().pageCount(transfer(buf, [buf]));
        if (live) {
          setPageCount(n);
          setPages(`1-${n}`);
        }
      } catch (e) {
        if (live) setLoadError(errorMessage(e));
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the file changes only
  }, [file]);

  const split = () =>
    task.run(async () => {
      const buf = await readFile(file!);
      const out = await api().split(transfer(buf, [buf]), stripExtension(file!.name), { mode, pages, every });
      const blob = new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: out.kind === 'zip' ? 'application/zip' : 'application/pdf' });
      const what = out.kind === 'zip' ? `${plural(out.fileCount, 'PDF')} in a ZIP` : plural(out.pageCount, 'page');
      return { blob, name: out.name, summary: `${out.name}: ${what}, ${formatBytes(blob.size)}` };
    });
  useRunShortcut(() => {
    if (file && pageCount && !task.busy) void split();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => setFile(f.find(isPdfFile) ?? null)} label="Drop a PDF to split" />
      {file && <FileList files={[file]} />}
      {file && pageCount !== null && (
        <p className="m-0 text-sm text-muted-foreground" data-testid="page-count">
          {plural(pageCount, 'page')}
        </p>
      )}
      <ErrorBox error={loadError} />
      <OptionsBar>
        <Segmented label="Split mode" value={mode} onChange={setMode} options={MODES} />
        {mode === 'every' ? (
          <NumberInput label="Pages per file" value={every} onChange={setEvery} min={1} max={pageCount ?? undefined} />
        ) : (
          <TextInput
            label={mode === 'extract' ? 'Pages to extract' : 'Ranges, one file each'}
            value={pages}
            onChange={setPages}
            placeholder="1-3, 5, 8-"
            testId="pages-input"
            className="w-64"
          />
        )}
        <Button variant="primary" onClick={() => void split()} disabled={!file || pageCount === null || task.busy} testId="run">
          Split
        </Button>
      </OptionsBar>
      <BusyLine busy={task.busy} label="Splitting…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename={task.result.name} summary={task.result.summary} />}
    </div>
  );
}
