import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/core/limits';
import { ToolError, type ToolProps } from '@/core/types';
import { BusyLine, Button, Checkbox, CopyButton, DownloadButton, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, TextInput, useRunShortcut } from '@/ui';
import { errorMessage, plural } from '../_lib/files';
import { parsePageRanges } from '../_lib/pages';
import { canvasToBlob, openPdf, renderPage } from '../_lib/pdfjs';
import { readFile } from '../_lib/ui';
import { startEngine, type Engine } from './engine';
import { averageConfidence, classifyInput, DEFAULT_DPI, DPI_CHOICES, joinPages, outputName, type OcrPageResult } from './logic';
import { createSearchablePdf } from './searchable';

interface Result {
  text: string;
  pdf: Blob | null;
  pages: number;
  words: number;
  confidence: number;
  name: string;
}

interface Progress {
  label: string;
  fraction: number | undefined;
}

async function imageToCanvas(file: File, maxEdge = 6000): Promise<HTMLCanvasElement> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new ToolError(`${file.name} could not be read as a picture. Use PNG, JPEG, WebP or BMP.`);
  }
  const k = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * k));
  canvas.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ToolError('This browser could not create a drawing surface.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas;
}

export default function PdfOcrTool({ initialFiles }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dpi, setDpi] = useState(String(DEFAULT_DPI));
  const [pages, setPages] = useState('');
  const [makePdf, setMakePdf] = useState(true);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const token = useRef({ cancelled: false });
  const engine = useRef<Engine | null>(null);

  useEffect(
    () => () => {
      token.current.cancelled = true;
      void engine.current?.terminate();
    },
    [],
  );

  const choose = (list: File[]) => {
    try {
      const { pdf, images } = classifyInput(list);
      setFiles(pdf ? [pdf] : images);
      setError(pdf || images.length ? null : 'Drop a PDF or some pictures (PNG, JPEG, WebP, BMP).');
    } catch (e) {
      setError(errorMessage(e));
    }
    setResult(null);
  };
  useEffect(() => {
    if (initialFiles?.length) choose(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for files handed over on open
  }, []);

  const busy = progress !== null;

  const run = async () => {
    if (!files.length || busy) return;
    const mine = { cancelled: false };
    token.current = mine;
    setError(null);
    setResult(null);
    setProgress({ label: 'Starting the text recognition engine (the first run downloads about 3 MB)…', fraction: undefined });
    const done: OcrPageResult[] = [];
    const numbers: number[] = [];
    try {
      engine.current = await startEngine((status, p) => {
        if (!mine.cancelled && status === 'recognizing text') setProgress((cur) => (cur ? { ...cur, fraction: p } : cur));
      });
      const scale = Number(dpi) / 72;
      const sheet = makePdf ? await createSearchablePdf() : null;
      const pdfFile = files.length === 1 && classifyInput(files).pdf ? files[0]! : null;
      const doc = pdfFile ? await openPdf(await readFile(pdfFile)) : null;
      const wanted = doc ? (pages.trim() ? [...new Set(parsePageRanges(pages, doc.numPages))] : Array.from({ length: doc.numPages }, (_, i) => i + 1)) : files.map((_, i) => i + 1);

      for (const [i, n] of wanted.entries()) {
        if (mine.cancelled) return;
        const where = `${i + 1} of ${wanted.length}`;
        setProgress({ label: `Reading page ${where}…`, fraction: undefined });
        const canvas = doc ? await renderPage(doc, n, scale) : await imageToCanvas(files[n - 1]!);
        const page = await engine.current.recognize(canvas);
        if (mine.cancelled) return;
        done.push(page);
        numbers.push(n);
        if (sheet) {
          const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
          const widthPt = doc ? canvas.width / scale : canvas.width;
          const heightPt = doc ? canvas.height / scale : canvas.height;
          await sheet.addPage({
            image: new Uint8Array(await blob.arrayBuffer()),
            kind: 'jpeg',
            widthPt,
            heightPt,
            scale: doc ? scale : 1,
            words: page.words,
          });
        }
        canvas.width = canvas.height = 0;
        setProgress({ label: `Finished page ${where}`, fraction: (i + 1) / wanted.length });
      }
      void doc?.destroy();
      const text = joinPages(done.map((d) => d.text), doc ? numbers : undefined);
      const base = files[0]!.name;
      const bytes = sheet ? await sheet.save() : null;
      setResult({
        text,
        pdf: bytes ? new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }) : null,
        pages: done.length,
        words: done.reduce((s, d) => s + d.words.length, 0),
        confidence: averageConfidence(done),
        name: base,
      });
    } catch (e) {
      if (!mine.cancelled) setError(e instanceof ToolError ? e.message : errorMessage(e));
    } finally {
      await engine.current?.terminate().catch(() => undefined);
      engine.current = null;
      if (!mine.cancelled) setProgress(null);
    }
  };
  useRunShortcut(() => void run());

  const cancel = () => {
    token.current.cancelled = true;
    void engine.current?.terminate();
    engine.current = null;
    setProgress(null);
  };

  const isPdf = files.length === 1 && classifyInput(files).pdf !== null;

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf,image/*" multiple onFiles={choose} label="Drop a scanned PDF, or some pictures, to read" />
      {files.length > 0 && <FileList files={files} onRemove={(i) => choose(files.filter((_, j) => j !== i))} />}
      <OptionsBar>
        <Select label="Detail" value={dpi} onChange={setDpi} options={DPI_CHOICES.map((d) => ({ value: String(d), label: `${d} dpi${d === DEFAULT_DPI ? ' (recommended)' : ''}` }))} />
        {isPdf && <TextInput label="Pages (blank for all)" value={pages} onChange={setPages} placeholder="All pages, or 1-3, 5" testId="pages-input" className="w-56" />}
        <Checkbox label="Also make a searchable PDF" checked={makePdf} onChange={setMakePdf} />
        <Button variant="primary" onClick={() => void run()} disabled={!files.length || busy} testId="run">
          Read text
        </Button>
        {busy && <Button onClick={cancel}>Cancel</Button>}
      </OptionsBar>
      <BusyLine busy={busy} label={progress?.label ?? ''} progress={progress?.fraction} />
      <ErrorBox error={error} />
      {result && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <div className="flex flex-wrap items-center gap-2">
            <PaneTitle>Recognised text</PaneTitle>
            <span className="flex-1" />
            <CopyButton text={result.text} primary />
            <DownloadButton data={result.text} filename={outputName(result.name, 'txt')} label="Download .txt" />
            {result.pdf && <DownloadButton data={result.pdf} filename={outputName(result.name, 'pdf')} type="application/pdf" label="Download searchable PDF" />}
          </div>
          <p className="m-0 text-sm text-muted-foreground" data-testid="result-summary">
            {plural(result.pages, 'page')}, {result.words.toLocaleString()} words, about {result.confidence}% confident{result.pdf ? `, searchable PDF ${formatBytes(result.pdf.size)}` : ''}
          </p>
          <textarea readOnly value={result.text} className="min-h-64 w-full rounded-md border bg-background p-2 font-mono text-sm" aria-label="Recognised text" data-testid="ocr-text" />
        </section>
      )}
    </div>
  );
}
