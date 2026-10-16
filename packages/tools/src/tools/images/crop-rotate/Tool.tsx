import { useEffect, useMemo, useState } from 'react';
import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from 'lucide-react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, Button, DownloadButton, ErrorBox, OptionsBar, PaneTitle, Select, useRunShortcut, useWorker } from '@/ui';
import { FORMATS, outputName } from '../_lib/formats';
import { ImageSource, OutputControls, RectFields, RegionPicker, ResultImage } from '../_lib/components';
import { errorMessage, useImageSession, useJob, useObjectUrl } from '../_lib/hooks';
import { DEFAULT_OUTPUT, outputSpec, type OutputChoice } from '../_lib/output';
import { clampRect, type Rect } from '../_lib/pixels';
import type { EncodedImage, PreviewImage } from '../_lib/session';
import { ASPECTS, centredRect, coversWholeImage, describeEdit, editedName, IDENTITY, isIdentity, rotateBy, transformedSize, type Transform } from './logic';

export default function ImageCropRotate({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const session = useImageSession(file, () => api());
  const [t, setT] = useState<Transform>(IDENTITY);
  const [aspectId, setAspectId] = useState('free');
  const [rect, setRect] = useState<Rect | null>(null);
  const [output, setOutput] = useState<OutputChoice>(DEFAULT_OUTPUT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(EncodedImage & { name: string; summary: string }) | null>(null);

  const info = session.info;
  const aspect = ASPECTS.find((a) => a.id === aspectId)?.ratio ?? null;
  const size = info ? transformedSize(info.width, info.height, t) : null;

  // A new picture starts untouched.
  useEffect(() => {
    setT(IDENTITY);
    setRect(null);
    setResult(null);
    setError(null);
  }, [info]);
  // Turning the picture changes what the crop box refers to, so start the box over.
  useEffect(() => {
    setRect(null);
    setResult(null);
  }, [t]);

  const preview = useJob<PreviewImage>(session.ready ? () => api().preview(t, 1400) as Promise<PreviewImage> : null, [file, session.ready, t.rotation, t.flipH, t.flipV], 80);
  const previewBlob = useMemo(() => (preview.result ? new Blob([preview.result.bytes as BlobPart], { type: 'image/png' }) : null), [preview.result]);
  const previewUrl = useObjectUrl(previewBlob);

  const crop = size && rect ? clampRect(rect, size.width, size.height) : null;
  const effectiveCrop = size && crop && !coversWholeImage(crop, size.width, size.height) ? crop : null;
  const summary = describeEdit(t, effectiveCrop);

  const pickAspect = (id: string) => {
    setAspectId(id);
    const ratio = ASPECTS.find((a) => a.id === id)?.ratio ?? null;
    if (size && ratio) setRect(centredRect(size.width, size.height, ratio));
  };

  const save = async () => {
    if (!file || !info || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { spec, format } = outputSpec(output, info.format);
      const out = (await api().save(t, effectiveCrop, spec)) as EncodedImage;
      setResult({ ...out, name: file ? editedName(file.name, FORMATS[format].ext) : outputName('image', FORMATS[format].ext), summary: summary ?? 'unchanged' });
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useRunShortcut(() => void save());

  return (
    <div className="flex flex-col gap-3">
      <ImageSource file={file} onFile={setFile} session={session} />
      {info && size && session.ready && (
        <>
          <OptionsBar>
            <div className="flex items-end gap-1" role="group" aria-label="Turn and flip">
              <Button onClick={() => setT((x) => rotateBy(x, -90))} title="Rotate 90° anticlockwise" testId="rotate-left">
                <RotateCcw /> Left
              </Button>
              <Button onClick={() => setT((x) => rotateBy(x, 90))} title="Rotate 90° clockwise" testId="rotate-right">
                <RotateCw /> Right
              </Button>
              <Button onClick={() => setT((x) => ({ ...x, flipH: !x.flipH }))} title="Mirror left to right" testId="flip-h">
                <FlipHorizontal2 /> Flip
              </Button>
              <Button onClick={() => setT((x) => ({ ...x, flipV: !x.flipV }))} title="Mirror top to bottom" testId="flip-v">
                <FlipVertical2 /> Flip
              </Button>
              <Button variant="ghost" onClick={() => setT(IDENTITY)} disabled={isIdentity(t)}>
                Reset
              </Button>
            </div>
            <Select label="Crop shape" value={aspectId} onChange={pickAspect} options={ASPECTS.map((a) => ({ value: a.id, label: a.label }))} />
            <OutputControls value={output} onChange={setOutput} />
            <Button variant="primary" onClick={() => void save()} disabled={busy || !summary} testId="run">
              Save picture
            </Button>
          </OptionsBar>
          {previewUrl && preview.result ? (
            <RegionPicker
              src={previewUrl}
              width={size.width}
              height={size.height}
              regions={crop ? [{ rect: crop, selected: true }] : []}
              onDraw={setRect}
              aspect={aspect}
              label="Picture. Drag to choose the area to keep."
            >
              <RectFields rect={crop ?? { x: 0, y: 0, w: size.width, h: size.height }} onChange={setRect} max={size} />
            </RegionPicker>
          ) : (
            <BusyLine busy={preview.busy} label="Preparing the picture…" />
          )}
          <p className="m-0 text-sm text-muted-foreground" data-testid="edit-summary">
            {size.width}×{size.height}
            {summary ? ` · ${summary}` : ' · drag on the picture to crop, or use the buttons to turn it'}
          </p>
          <ErrorBox error={preview.error} />
        </>
      )}
      <BusyLine busy={busy} label="Saving…" />
      <ErrorBox error={error} />
      {result && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-info">
            {result.name}: {result.width}×{result.height} · {formatBytes(result.bytes.length)} · {result.summary}
          </p>
          <ResultImage bytes={result.bytes} mime={result.mime} format={result.format} alt={`Edited image: ${result.name}`} />
          <div>
            <DownloadButton data={new Blob([result.bytes as BlobPart], { type: result.mime })} filename={result.name} type={result.mime} label="Download" />
          </div>
        </section>
      )}
    </div>
  );
}
