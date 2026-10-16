import { useState } from 'react';
import { transfer } from 'comlink';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, OptionsBar, useRunShortcut, useWorker } from '@/ui';
import { isPdfFile, plural } from '../_lib/files';
import { BusyLine, FileResult, readFile, useTask } from '../_lib/ui';

export default function MergeTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [files, setFiles] = useState<File[]>(() => (initialFiles ?? []).filter(isPdfFile));
  const [notice, setNotice] = useState<string | null>(null);
  const task = useTask<{ blob: Blob; pageCount: number }>();

  const add = (list: File[]) => {
    const pdfs = list.filter(isPdfFile);
    setNotice(pdfs.length < list.length ? 'Some files were skipped because they are not PDFs.' : null);
    setFiles((f) => [...f, ...pdfs]);
    task.reset();
  };
  const move = (i: number, d: -1 | 1) => {
    setFiles((f) => {
      const next = [...f];
      const j = i + d;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
    task.reset();
  };

  const merge = () =>
    task.run(async () => {
      const inputs = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: await readFile(f) })));
      const out = await api().merge(transfer(inputs, inputs.map((i) => i.bytes)));
      return { blob: new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), pageCount: out.pageCount };
    });
  useRunShortcut(() => {
    if (files.length >= 2 && !task.busy) void merge();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" multiple accept="application/pdf,.pdf" onFiles={add} label="Drop PDFs here to merge" />
      {notice && <p className="m-0 text-sm text-muted-foreground">{notice}</p>}
      {files.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-1 p-0" aria-label="PDFs to merge, in order" data-testid="merge-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm" data-testid="merge-item">
              <span className="w-6 text-muted-foreground">{i + 1}.</span>
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                <ArrowUp />
                <span className="sr-only">Move {f.name} up</span>
              </Button>
              <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === files.length - 1} title="Move down">
                <ArrowDown />
                <span className="sr-only">Move {f.name} down</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setFiles((l) => l.filter((_, k) => k !== i));
                  task.reset();
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ol>
      )}
      <OptionsBar>
        <Button variant="primary" onClick={() => void merge()} disabled={files.length < 2 || task.busy} testId="run">
          Merge {files.length >= 2 ? plural(files.length, 'PDF') : ''}
        </Button>
        {files.length === 1 && <span className="text-sm text-muted-foreground">Add at least one more PDF.</span>}
      </OptionsBar>
      <BusyLine busy={task.busy} label="Merging…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename="merged.pdf" summary={`merged.pdf: ${plural(task.result.pageCount, 'page')}, ${formatBytes(task.result.blob.size)}`} />}
    </div>
  );
}
