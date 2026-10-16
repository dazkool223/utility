import { useState } from 'react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, Button, Checkbox, DownloadButton, ErrorBox, NumberInput, OptionsBar, PaneTitle, Segmented, Select, useRunShortcut, useWorker } from '@/ui';
import { FORMATS, outputName, percentSaved } from '../_lib/formats';
import { ImageSource, OutputControls, ResultImage } from '../_lib/components';
import { errorMessage, useImageSession } from '../_lib/hooks';
import { DEFAULT_OUTPUT, outputSpec, type OutputChoice } from '../_lib/output';
import type { ResizeMethod } from '../_lib/codecs';
import type { EncodedImage } from '../_lib/session';
import { EDGE_PRESETS, fitEdge, linkedHeight, linkedWidth, targetSize, type ResizeMode } from './logic';

const METHODS: Array<{ value: ResizeMethod; label: string }> = [
  { value: 'lanczos3', label: 'Lanczos (sharpest)' },
  { value: 'mitchell', label: 'Mitchell (balanced)' },
  { value: 'catrom', label: 'Catmull-Rom' },
  { value: 'triangle', label: 'Triangle (fast, soft)' },
];

export default function ImageResize({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const session = useImageSession(file, () => api());
  const [mode, setMode] = useState<ResizeMode>('pixels');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [percent, setPercent] = useState(50);
  const [lock, setLock] = useState(true);
  const [method, setMethod] = useState<ResizeMethod>('lanczos3');
  const [output, setOutput] = useState<OutputChoice>(DEFAULT_OUTPUT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(EncodedImage & { name: string }) | null>(null);

  const info = session.info;
  // Start from the picture's own size once it has been read.
  const [seen, setSeen] = useState<typeof info>(null);
  if (info && info !== seen) {
    setSeen(info);
    setWidth(info.width);
    setHeight(info.height);
    setResult(null);
  }

  const changeWidth = (w: number) => {
    setWidth(w);
    if (lock && info) setHeight(linkedHeight(info.width, info.height, w));
  };
  const changeHeight = (h: number) => {
    setHeight(h);
    if (lock && info) setWidth(linkedWidth(info.width, info.height, h));
  };

  let planned: { width: number; height: number } | null = null;
  let planError: string | null = null;
  if (info) {
    try {
      planned = targetSize(info.width, info.height, { mode, width, height, percent });
    } catch (e) {
      planError = errorMessage(e);
    }
  }

  const run = async () => {
    if (!file || !info || !planned || busy || !session.ready) return;
    setBusy(true);
    setError(null);
    try {
      const { spec, format } = outputSpec(output, info.format);
      const out = (await api().resize(planned.width, planned.height, method, spec)) as EncodedImage;
      setResult({ ...out, name: outputName(file.name, FORMATS[format].ext, `-${out.width}x${out.height}`) });
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useRunShortcut(() => void run());

  const choose = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError(null);
    setSeen(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <ImageSource file={file} onFile={choose} session={session} />
      {info && session.ready && (
        <>
          <OptionsBar>
            <Segmented
              label="Resize by"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pixels', label: 'Pixels' },
                { value: 'percent', label: 'Percent' },
              ]}
            />
            {mode === 'pixels' ? (
              <>
                <NumberInput label="Width (px)" value={width} onChange={changeWidth} min={1} max={16384} />
                <NumberInput label="Height (px)" value={height} onChange={changeHeight} min={1} max={16384} />
                <Checkbox label="Keep proportions" checked={lock} onChange={setLock} />
                <Select
                  label="Longest side"
                  value=""
                  onChange={(v) => {
                    if (!v) return;
                    const s = fitEdge(info.width, info.height, Number(v));
                    setWidth(s.width);
                    setHeight(s.height);
                  }}
                  options={[{ value: '', label: 'Preset…' }, ...EDGE_PRESETS.map((e) => ({ value: String(e), label: `${e} px` }))]}
                />
              </>
            ) : (
              <NumberInput label="Scale (%)" value={percent} onChange={setPercent} min={1} max={1000} />
            )}
            <Select label="Resampling" value={method} onChange={setMethod} options={METHODS} />
            <OutputControls value={output} onChange={setOutput} />
            <Button variant="primary" onClick={() => void run()} disabled={busy || !planned} testId="run">
              Resize
            </Button>
          </OptionsBar>
          <p className="m-0 text-sm text-muted-foreground" data-testid="resize-plan">
            {info.width}×{info.height}
            {planned ? ` → ${planned.width}×${planned.height}` : ''}
          </p>
          <ErrorBox error={planError} />
        </>
      )}
      <BusyLine busy={busy} label="Resizing and encoding…" />
      <ErrorBox error={error} />
      {result && file && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-info">
            {result.name}: {result.width}×{result.height} · {formatBytes(file.size)} → {formatBytes(result.bytes.length)} ({percentSaved(file.size, result.bytes.length) >= 0 ? '−' : '+'}
            {Math.abs(percentSaved(file.size, result.bytes.length))}%)
          </p>
          <ResultImage bytes={result.bytes} mime={result.mime} format={result.format} alt={`Resized image: ${result.name}`} />
          <div>
            <DownloadButton data={new Blob([result.bytes as BlobPart], { type: result.mime })} filename={result.name} type={result.mime} label="Download" />
          </div>
        </section>
      )}
    </div>
  );
}
