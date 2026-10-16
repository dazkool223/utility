import { useEffect, useRef, useState } from 'react';
import { transfer } from 'comlink';
import { ArrowLeft, ArrowRight, RotateCw, Trash2, Undo2 } from 'lucide-react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, FileList, OptionsBar, cn, useRunShortcut, useWorker } from '@/ui';
import { canvasToBlob, openPdf, renderPage } from '../_lib/pdfjs';
import { errorMessage, isPdfFile, plural, stripExtension } from '../_lib/files';
import { BusyLine, FileResult, readFile, useTask } from '../_lib/ui';

interface Card {
  /** 0-based page index in the source PDF. */
  index: number;
  rotate: number;
  deleted: boolean;
}

export default function OrganiseTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [cards, setCards] = useState<Card[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const task = useTask<{ blob: Blob; name: string; summary: string }>();

  useEffect(() => {
    setCards([]);
    setThumbs({});
    setLoadError(null);
    task.reset();
    if (!file) return;
    let live = true;
    const urls: string[] = [];
    void (async () => {
      setLoading(true);
      try {
        const doc = await openPdf(await readFile(file));
        if (!live) return;
        setCards(Array.from({ length: doc.numPages }, (_, index) => ({ index, rotate: 0, deleted: false })));
        for (let n = 1; n <= doc.numPages && live; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const canvas = await renderPage(doc, n, Math.min(1, 180 / Math.max(base.width, base.height)));
          const url = URL.createObjectURL(await canvasToBlob(canvas, 'image/png'));
          urls.push(url);
          if (live) setThumbs((t) => ({ ...t, [n - 1]: url }));
        }
        void doc.destroy();
      } catch (e) {
        if (live) setLoadError(errorMessage(e));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the file changes only
  }, [file]);

  const edit = (fn: (c: Card[]) => Card[]) => {
    setCards(fn);
    task.reset();
  };
  const move = (from: number, to: number) =>
    edit((c) => {
      if (to < 0 || to >= c.length || from === to) return c;
      const next = [...c];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
  const patch = (pos: number, p: Partial<Card>) => edit((c) => c.map((x, i) => (i === pos ? { ...x, ...p } : x)));

  const kept = cards.filter((c) => !c.deleted);
  const save = () =>
    task.run(async () => {
      const buf = await readFile(file!);
      const out = await api().organise(
        transfer(buf, [buf]),
        kept.map((c) => ({ index: c.index, rotate: c.rotate })),
      );
      const blob = new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const name = `${stripExtension(file!.name)}-organised.pdf`;
      return { blob, name, summary: `${name}: ${plural(out.pageCount, 'page')}, ${formatBytes(blob.size)}` };
    });
  useRunShortcut(() => {
    if (kept.length && !task.busy) void save();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => setFile(f.find(isPdfFile) ?? null)} label="Drop a PDF to reorder or delete its pages" />
      {file && <FileList files={[file]} />}
      <ErrorBox error={loadError} />
      <BusyLine busy={loading} label="Loading page previews…" />
      {cards.length > 0 && (
        <>
          <ol className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label="Pages, in output order" data-testid="page-grid">
            {cards.map((c, pos) => (
              <li
                key={c.index}
                data-testid="page-card"
                data-page={c.index + 1}
                data-deleted={c.deleted}
                draggable
                onDragStart={() => (dragFrom.current = pos)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) move(dragFrom.current, pos);
                  dragFrom.current = null;
                }}
                className={cn('flex w-40 flex-col items-center gap-2 rounded-lg border bg-card p-2', c.deleted && 'opacity-40')}
              >
                <div className="flex h-44 w-full items-center justify-center overflow-hidden">
                  {thumbs[c.index] ? (
                    <img src={thumbs[c.index]} alt={`Page ${c.index + 1}`} className="max-h-full max-w-full object-contain shadow-sm transition-transform" style={{ transform: `rotate(${c.rotate}deg)` }} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Page {c.index + 1}
                  {c.deleted ? ' (deleted)' : ''}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => move(pos, pos - 1)} disabled={pos === 0} title="Move earlier">
                    <ArrowLeft />
                    <span className="sr-only">Move page {c.index + 1} earlier</span>
                  </Button>
                  <Button variant="ghost" onClick={() => move(pos, pos + 1)} disabled={pos === cards.length - 1} title="Move later">
                    <ArrowRight />
                    <span className="sr-only">Move page {c.index + 1} later</span>
                  </Button>
                  <Button variant="ghost" onClick={() => patch(pos, { rotate: (c.rotate + 90) % 360 })} disabled={c.deleted} title="Rotate 90° clockwise">
                    <RotateCw />
                    <span className="sr-only">Rotate page {c.index + 1}</span>
                  </Button>
                  <Button variant="ghost" onClick={() => patch(pos, { deleted: !c.deleted })} title={c.deleted ? 'Restore' : 'Delete'}>
                    {c.deleted ? <Undo2 /> : <Trash2 />}
                    <span className="sr-only">{c.deleted ? 'Restore' : 'Delete'} page {c.index + 1}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <OptionsBar>
            <Button variant="primary" onClick={() => void save()} disabled={!kept.length || task.busy} testId="run">
              Save PDF ({plural(kept.length, 'page')})
            </Button>
            {!kept.length && <span className="text-sm text-muted-foreground">Restore at least one page.</span>}
          </OptionsBar>
        </>
      )}
      <BusyLine busy={task.busy} label="Saving…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename={task.result.name} summary={task.result.summary} />}
    </div>
  );
}
