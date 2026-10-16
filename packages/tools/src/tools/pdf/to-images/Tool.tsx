import { useEffect, useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, DownloadButton, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, TextInput, useRunShortcut, useWorker } from '@/ui';
import { parsePageRanges } from '../_lib/pages';
import { canvasToBlob, openPdf, renderPage } from '../_lib/pdfjs';
import { errorMessage, isPdfFile, plural, stripExtension } from '../_lib/files';
import { BusyLine, readFile } from '../_lib/ui';
import { DPI_CHOICES, dpiToScale, imageFileName, mimeFor, type ImageFormat } from './logic';

interface Rendered {
  page: number;
  name: string;
  blob: Blob;
  url: string;
}

export default function ToImagesTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [dpi, setDpi] = useState('150');
  const [pages, setPages] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Rendered[]>([]);
  const [zip, setZip] = useState<Blob | null>(null);

  // Free the previews when the results are replaced or the Tool closes.
  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), [images]);

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setImages([]);
    setZip(null);
    setProgress(0);
    const made: Rendered[] = [];
    try {
      const doc = await openPdf(await readFile(file));
      const wanted = pages.trim() ? [...new Set(parsePageRanges(pages, doc.numPages))] : Array.from({ length: doc.numPages }, (_, i) => i + 1);
      const base = stripExtension(file.name);
      for (const [i, n] of wanted.entries()) {
        const canvas = await renderPage(doc, n, dpiToScale(Number(dpi)));
        const blob = await canvasToBlob(canvas, mimeFor(format));
        canvas.width = canvas.height = 0;
        made.push({ page: n, name: imageFileName(base, n, doc.numPages, format), blob, url: URL.createObjectURL(blob) });
        setProgress((i + 1) / wanted.length);
      }
      void doc.destroy();
      setImages(made);
      if (made.length > 1) {
        const files = await Promise.all(made.map(async (m) => ({ name: m.name, bytes: new Uint8Array(await m.blob.arrayBuffer()) })));
        const bytes = await api().zip(transfer(files, files.map((f) => f.bytes.buffer)));
        setZip(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' }));
      }
    } catch (e) {
      made.forEach((m) => URL.revokeObjectURL(m.url));
      setError(e instanceof ToolError ? e.message : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useRunShortcut(() => {
    if (file && !busy) void convert();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => { setFile(f.find(isPdfFile) ?? null); setImages([]); setZip(null); setError(null); }} label="Drop a PDF to turn into images" />
      {file && <FileList files={[file]} />}
      <OptionsBar>
        <Select
          label="Format"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'png', label: 'PNG (sharp, larger)' },
            { value: 'jpg', label: 'JPG (smaller)' },
          ]}
        />
        <Select label="Resolution" value={dpi} onChange={setDpi} options={DPI_CHOICES.map((d) => ({ value: String(d), label: `${d} dpi` }))} />
        <TextInput label="Pages (blank for all)" value={pages} onChange={setPages} placeholder="All pages, or 1-3, 5" testId="pages-input" className="w-64" />
        <Button variant="primary" onClick={() => void convert()} disabled={!file || busy} testId="run">
          Convert
        </Button>
      </OptionsBar>
      <BusyLine busy={busy} label="Rendering pages…" progress={progress} />
      <ErrorBox error={error} />
      {images.length > 0 && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <div className="flex flex-wrap items-center gap-2">
            <PaneTitle>Result</PaneTitle>
            <span className="flex-1" />
            <span className="text-sm" data-testid="result-summary">
              {plural(images.length, 'image')}, {formatBytes(images.reduce((n, i) => n + i.blob.size, 0))}
            </span>
            {zip && <DownloadButton data={zip} filename={`${stripExtension(file?.name ?? 'pdf')}-images.zip`} type="application/zip" label="Download all (ZIP)" />}
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {images.map((img) => (
              <li key={img.name} className="flex w-44 flex-col items-center gap-1 rounded-lg border p-2 text-xs" data-testid="image-result" data-page={img.page}>
                <img src={img.url} alt={`Page ${img.page}`} className="max-h-48 max-w-full object-contain" data-testid="image-preview" />
                <span className="max-w-full truncate">{img.name}</span>
                <span className="text-muted-foreground">{formatBytes(img.blob.size)}</span>
                <DownloadButton data={img.blob} filename={img.name} type={img.blob.type} label="Download" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
