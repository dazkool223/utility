import { useEffect, useRef, useState } from 'react';
import { transfer } from 'comlink';
import type { ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { BusyLine, Button, Checkbox, downloadBlob, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, useRunShortcut, useWorker } from '@/ui';
import { FORMAT_ORDER, FORMATS, outputName, percentSaved, type RasterFormat } from '../_lib/formats';
import { ResultImage, Slider } from '../_lib/components';
import { errorMessage } from '../_lib/hooks';
import type { EncodedImage } from '../_lib/session';
import { buildSpec, DEFAULT_QUALITY, defaultOptions, hasLosslessMode, hasQuality, uniqueNames, type ConvertOptions } from './logic';

interface Row {
  id: number;
  name: string;
  inputBytes: number;
  result?: EncodedImage;
  error?: string;
}

const ACCEPT = 'image/*,.avif,.jxl,.qoi,.webp';

export default function ImageConvert({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [files, setFiles] = useState<File[]>(initialFiles ?? []);
  const [opts, setOpts] = useState<ConvertOptions>(defaultOptions);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<{ index: number; name: string } | null>(null);
  const [preparing, setPreparing] = useState<RasterFormat | null>(null);
  const run = useRef(0);

  // Start fetching the chosen encoder as soon as it is picked, so Convert does not wait on the download.
  useEffect(() => {
    const format = opts.format;
    let current = true;
    setPreparing(format);
    api()
      .warm(format)
      .finally(() => current && setPreparing(null));
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `api` is stable for the life of the Tool
  }, [opts.format]);

  const set = <K extends keyof ConvertOptions>(key: K, value: ConvertOptions[K]) => setOpts((o) => ({ ...o, [key]: value }));
  const changeFormat = (format: RasterFormat) => setOpts((o) => ({ ...o, format, quality: DEFAULT_QUALITY[format], lossless: hasLosslessMode(format) ? o.lossless : false }));

  const convert = async () => {
    if (!files.length || busy) return;
    const id = ++run.current;
    setBusy(true);
    setError(null);
    setRows([]);
    let spec;
    try {
      spec = buildSpec(opts);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      return;
    }
    const done: Row[] = [];
    const problems: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        setStep({ index: i, name: file.name });
        const buf = await file.arrayBuffer();
        const result = (await api().convert(transfer(buf, [buf]), spec)) as EncodedImage;
        done.push({ id: i, name: outputName(file.name, FORMATS[opts.format].ext), inputBytes: file.size, result });
      } catch (e) {
        problems.push(`${file.name}: ${errorMessage(e)}`);
      }
      if (id !== run.current) return;
      setRows([...done]);
    }
    setError(problems.length ? problems.join('\n') : null);
    setStep(null);
    setBusy(false);
  };
  useRunShortcut(convert);

  const downloadAll = async () => {
    const { zipSync } = await import('fflate');
    const names = uniqueNames(rows.map((r) => r.name));
    const entries: Record<string, Uint8Array> = {};
    rows.forEach((r, i) => (entries[names[i]!] = r.result!.bytes));
    downloadBlob(new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: 'application/zip' }), 'converted-images.zip', 'application/zip');
  };

  const fmt = FORMATS[opts.format];
  const first = rows[0]?.result;

  return (
    <div className="flex flex-col gap-3">
      <FileDrop
        kind="image"
        accept={ACCEPT}
        multiple
        label="Drop images here (PNG, JPEG, WebP, GIF, BMP, AVIF, JPEG XL, QOI)"
        onFiles={(f) => {
          setFiles((cur) => [...cur, ...f]);
          setRows([]);
          setError(null);
        }}
      />
      {files.length > 0 && (
        <FileList
          files={files}
          onRemove={(i) => {
            setFiles((cur) => cur.filter((_, j) => j !== i));
            setRows([]);
          }}
        />
      )}

      <OptionsBar>
        <Select label="Convert to" value={opts.format} onChange={changeFormat} options={FORMAT_ORDER.map((f) => ({ value: f, label: FORMATS[f].label }))} />
        {hasLosslessMode(opts.format) && <Checkbox label="Lossless" checked={opts.lossless} onChange={(v) => set('lossless', v)} />}
        {hasQuality(opts.format, opts.lossless) && <Slider label="Quality" value={opts.quality} onChange={(v) => set('quality', v)} testId="quality" />}
        {opts.format === 'avif' && !opts.lossless && (
          <Slider label="Speed (higher is faster, larger file)" value={opts.avifSpeed} min={0} max={10} onChange={(v) => set('avifSpeed', v)} />
        )}
        {opts.format === 'jpeg' && (
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Background for transparency
            <input type="color" value={opts.background} onChange={(e) => set('background', e.target.value)} className="h-8 w-16 rounded border bg-background" />
          </label>
        )}
        <Button variant="primary" onClick={convert} disabled={!files.length || busy} testId="convert">
          {busy ? 'Converting…' : `Convert to ${fmt.label}`}
        </Button>
      </OptionsBar>

      <BusyLine
        busy={busy || preparing !== null}
        label={
          busy && step
            ? `Converting ${step.name}${files.length > 1 ? ` (${step.index + 1} of ${files.length})` : ''}…${opts.format === 'avif' || opts.format === 'jxl' ? ' this format is slow to encode' : ''}`
            : `Loading the ${FORMATS[preparing ?? opts.format].label} encoder…`
        }
        progress={busy && step && files.length > 1 ? step.index / files.length : undefined}
      />
      <ErrorBox error={error} />

      {rows.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Converted</PaneTitle>
            <span className="flex-1" />
            {rows.length > 1 && (
              <Button variant="primary" onClick={downloadAll}>
                Download all (.zip)
              </Button>
            )}
          </div>
          <ul className="flex flex-col gap-1" data-testid="tool-output">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="text-xs text-muted-foreground" data-testid="result-info">
                  {FORMATS[r.result!.format].label} · {r.result!.width}×{r.result!.height} · {formatBytes(r.inputBytes)} → {formatBytes(r.result!.bytes.length)} ({percentSaved(r.inputBytes, r.result!.bytes.length) >= 0 ? '−' : '+'}
                  {Math.abs(percentSaved(r.inputBytes, r.result!.bytes.length))}%)
                </span>
                <Button onClick={() => downloadBlob(new Blob([r.result!.bytes as BlobPart], { type: r.result!.mime }), r.name, r.result!.mime)}>Download</Button>
              </li>
            ))}
          </ul>
          {rows.length === 1 && first && <ResultImage bytes={first.bytes} mime={first.mime} format={first.format} alt={`Converted image: ${rows[0]!.name}`} />}
        </section>
      )}
    </div>
  );
}
