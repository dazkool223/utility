import { useMemo, useState } from 'react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, DownloadButton, ErrorBox, OptionsBar, PaneTitle, Select, useWorker } from '@/ui';
import { FORMATS, isBrowserDisplayable, type RasterFormat } from '../_lib/formats';
import { BeforeAfter, ImageSource, OutputControls, ResultImage } from '../_lib/components';
import { useImageSession, useJob, useObjectUrl } from '../_lib/hooks';
import type { OutputChoice } from '../_lib/output';
import type { EncodedImage } from '../_lib/session';
import { compressedName, compressSpec, DEFAULT_COMPRESS, EDGE_CHOICES, outcome, PNG_LEVELS, type CompressOptions } from './logic';

export default function ImageCompress({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const session = useImageSession(file, () => api());
  const [opts, setOpts] = useState<CompressOptions>(DEFAULT_COMPRESS);
  const info = session.info;

  const plan = useMemo(() => {
    if (!info) return null;
    try {
      return { ...compressSpec(opts, info.format), error: null as string | null };
    } catch (e) {
      return { spec: null, format: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [opts, info]);

  const job = useJob<EncodedImage>(
    session.ready && plan?.spec ? () => api().compress(plan.spec, opts.maxEdge) as Promise<EncodedImage> : null,
    [file, session.ready, JSON.stringify(plan?.spec), opts.maxEdge],
  );
  const result = job.result;

  const originalUrl = useObjectUrl(file);
  const resultBlob = useMemo(() => (result ? new Blob([result.bytes as BlobPart], { type: result.mime }) : null), [result]);
  const resultUrl = useObjectUrl(resultBlob);

  const set = <K extends keyof CompressOptions>(key: K, value: CompressOptions[K]) => setOpts((o) => ({ ...o, [key]: value }));
  const verdict = result && file ? outcome(file.size, result.bytes.length) : null;
  const canCompare = !!(result && originalUrl && resultUrl && info && isBrowserDisplayable(info.format) && isBrowserDisplayable(result.format) && result.width === info.width && result.height === info.height);
  const resolved: RasterFormat | null = plan?.format ?? null;

  return (
    <div className="flex flex-col gap-3">
      <ImageSource
        file={file}
        onFile={(f) => {
          setFile(f);
        }}
        session={session}
      />
      {info && session.ready && (
        <OptionsBar>
          <OutputControls value={opts.output} onChange={(v: OutputChoice) => set('output', v)} />
          {resolved === 'png' && (
            <Select label="PNG effort" value={String(opts.pngLevel)} onChange={(v) => set('pngLevel', Number(v))} options={PNG_LEVELS.map((l) => ({ value: String(l.value), label: l.label }))} />
          )}
          <Select
            label="Limit longest side"
            value={opts.maxEdge === null ? '' : String(opts.maxEdge)}
            onChange={(v) => set('maxEdge', v === '' ? null : Number(v))}
            options={[{ value: '', label: 'Keep size' }, ...EDGE_CHOICES.map((e) => ({ value: String(e), label: `${e} px` }))]}
          />
        </OptionsBar>
      )}
      <ErrorBox error={plan?.error ?? null} />
      <BusyLine busy={job.busy} label={`Compressing${resolved ? ` as ${FORMATS[resolved].label}` : ''}…`} />
      <ErrorBox error={job.error} />
      {result && file && verdict && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-info">
            {formatBytes(file.size)} → {formatBytes(result.bytes.length)} ·{' '}
            {verdict.kind === 'smaller' ? `${verdict.percent}% smaller` : verdict.kind === 'larger' ? `${verdict.percent}% larger than the original` : 'same size as the original'} · {result.width}×{result.height}
          </p>
          {verdict.kind === 'larger' && <p className="m-0 text-sm text-muted-foreground">This file was already well compressed. Lower the quality, pick another format, or keep the original.</p>}
          {canCompare ? <BeforeAfter before={originalUrl!} after={resultUrl!} beforeLabel="Original" afterLabel="Compressed" /> : <ResultImage bytes={result.bytes} mime={result.mime} format={result.format} alt="Compressed image" />}
          <div>
            <DownloadButton
              data={resultBlob}
              filename={compressedName(file.name, FORMATS[result.format].ext)}
              type={result.mime}
              label={`Download ${compressedName(file.name, FORMATS[result.format].ext)}`}
            />
          </div>
        </section>
      )}
    </div>
  );
}
