import { useEffect, useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, FileList, OptionsBar, Select, TextInput, useRunShortcut, useWorker } from '@/ui';
import { isPdfFile, plural, stripExtension, errorMessage } from '../_lib/files';
import { BusyLine, FileResult, readFile, useTask } from '../_lib/ui';
import type { RotateAngle } from './logic';

const ANGLES: Array<{ value: `${RotateAngle}`; label: string }> = [
  { value: '90', label: '90° clockwise' },
  { value: '180', label: '180°' },
  { value: '270', label: '90° counter-clockwise' },
];

export default function RotateTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [angle, setAngle] = useState<`${RotateAngle}`>('90');
  const [pages, setPages] = useState('');
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
        if (live) setPageCount(n);
      } catch (e) {
        if (live) setLoadError(errorMessage(e));
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the file changes only
  }, [file]);

  const rotate = () =>
    task.run(async () => {
      const buf = await readFile(file!);
      const out = await api().rotate(transfer(buf, [buf]), Number(angle) as RotateAngle, pages);
      const blob = new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const name = `${stripExtension(file!.name)}-rotated.pdf`;
      return { blob, name, summary: `${name}: rotated ${plural(out.rotated, 'page')} of ${out.pageCount}, ${formatBytes(blob.size)}` };
    });
  useRunShortcut(() => {
    if (file && pageCount && !task.busy) void rotate();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => setFile(f.find(isPdfFile) ?? null)} label="Drop a PDF to rotate" />
      {file && <FileList files={[file]} />}
      {file && pageCount !== null && (
        <p className="m-0 text-sm text-muted-foreground" data-testid="page-count">
          {plural(pageCount, 'page')}
        </p>
      )}
      <ErrorBox error={loadError} />
      <OptionsBar>
        <Select label="Rotation" value={angle} onChange={setAngle} options={ANGLES} />
        <TextInput label="Pages (blank for all)" value={pages} onChange={setPages} placeholder="All pages, or 1-3, 5" testId="pages-input" className="w-64" />
        <Button variant="primary" onClick={() => void rotate()} disabled={!file || pageCount === null || task.busy} testId="run">
          Rotate
        </Button>
      </OptionsBar>
      <BusyLine busy={task.busy} label="Rotating…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename={task.result.name} summary={task.result.summary} />}
    </div>
  );
}
