import { useState } from 'react';
import { transfer } from 'comlink';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatBytes } from '@/core/limits';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, NumberInput, OptionsBar, Select, useRunShortcut, useWorker } from '@/ui';
import { plural } from '../_lib/files';
import { BusyLine, FileResult, readFile, useTask } from '../_lib/ui';
import { detectImageType } from './imageType';
import type { Orientation, PageSize } from './logic';

/** Decode with the browser and re-encode as PNG (WebP, GIF, AVIF, BMP and so on). */
async function toPng(file: File): Promise<ArrayBuffer> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ToolError(`${file.name}: this browser cannot read that image format.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new ToolError(`${file.name}: the image could not be converted.`);
  return blob.arrayBuffer();
}

export default function ImagesToPdfTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [files, setFiles] = useState<File[]>(() => (initialFiles ?? []).filter((f) => f.type.startsWith('image/')));
  const [notice, setNotice] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('fit');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState(24);
  const task = useTask<{ blob: Blob; pageCount: number }>();

  const add = (list: File[]) => {
    const images = list.filter((f) => f.type.startsWith('image/'));
    setNotice(images.length < list.length ? 'Some files were skipped because they are not images.' : null);
    setFiles((f) => [...f, ...images]);
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

  const build = () =>
    task.run(async () => {
      const images = await Promise.all(
        files.map(async (f) => {
          let bytes = await readFile(f);
          if (!detectImageType(new Uint8Array(bytes))) bytes = await toPng(f);
          return { name: f.name, bytes };
        }),
      );
      const out = await api().build(transfer(images, images.map((i) => i.bytes)), { pageSize, orientation, margin });
      return { blob: new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), pageCount: out.pageCount };
    });
  useRunShortcut(() => {
    if (files.length && !task.busy) void build();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="image" multiple accept="image/*" onFiles={add} label="Drop images here, one page each" />
      {notice && <p className="m-0 text-sm text-muted-foreground">{notice}</p>}
      {files.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Images, in page order" data-testid="image-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm" data-testid="image-item">
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
        <Select
          label="Page size"
          value={pageSize}
          onChange={setPageSize}
          options={[
            { value: 'fit', label: 'Same as the image' },
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'US Letter' },
          ]}
        />
        {pageSize !== 'fit' && (
          <>
            <Select
              label="Orientation"
              value={orientation}
              onChange={setOrientation}
              options={[
                { value: 'auto', label: 'Match each image' },
                { value: 'portrait', label: 'Portrait' },
                { value: 'landscape', label: 'Landscape' },
              ]}
            />
            <NumberInput label="Margin (points)" value={margin} onChange={setMargin} min={0} max={200} />
          </>
        )}
        <Button variant="primary" onClick={() => void build()} disabled={!files.length || task.busy} testId="run">
          Create PDF
        </Button>
      </OptionsBar>
      <BusyLine busy={task.busy} label="Creating PDF…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename="images.pdf" summary={`images.pdf: ${plural(task.result.pageCount, 'page')}, ${formatBytes(task.result.blob.size)}`} />}
    </div>
  );
}
