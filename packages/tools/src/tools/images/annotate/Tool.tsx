import { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, Grid3x3, Stamp, Type } from 'lucide-react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, Button, Checkbox, DownloadButton, ErrorBox, NumberInput, OptionsBar, PaneTitle, TextInput, useRunShortcut, useWorker } from '@/ui';
import { cn } from '@/ui';
import { FORMATS } from '../_lib/formats';
import { ImageSource, OutputControls, RectFields, RegionPicker, ResultImage, Slider } from '../_lib/components';
import { errorMessage, useImageSession, useJob, useObjectUrl } from '../_lib/hooks';
import { DEFAULT_OUTPUT, outputSpec, type OutputChoice } from '../_lib/output';
import type { Rect } from '../_lib/pixels';
import type { EncodedImage, PreviewImage } from '../_lib/session';
import { annotatedName, annotationBounds, describeAnnotation, MAX_ANNOTATIONS, newAnnotation, validateAnnotation, type Annotation, type AnnotationKind } from './logic';

const ADD: Array<{ kind: AnnotationKind; label: string; icon: typeof Type }> = [
  { kind: 'text', label: 'Add text', icon: Type },
  { kind: 'watermark', label: 'Add watermark', icon: Stamp },
  { kind: 'pixelate', label: 'Pixelate area', icon: Grid3x3 },
  { kind: 'redact', label: 'Cover area', icon: EyeOff },
];

function Colour({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-16 rounded border bg-background" />
    </label>
  );
}

export default function ImageAnnotate({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const session = useImageSession(file, () => api());
  const [items, setItems] = useState<Annotation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [output, setOutput] = useState<OutputChoice>(DEFAULT_OUTPUT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(EncodedImage & { name: string }) | null>(null);
  const nextId = useRef(1);

  const info = session.info;
  useEffect(() => {
    setItems([]);
    setSelected(null);
    setResult(null);
    setError(null);
  }, [info]);

  // Only annotations that can be drawn are sent to the preview; the others show their problem next to the list.
  const problems = useMemo(() => {
    const map = new Map<number, string>();
    if (!info) return map;
    for (const a of items) {
      try {
        validateAnnotation(a, info.width, info.height);
      } catch (e) {
        map.set(a.id, errorMessage(e));
      }
    }
    return map;
  }, [items, info]);
  const drawable = useMemo(() => items.filter((a) => !problems.has(a.id)), [items, problems]);

  const preview = useJob<PreviewImage>(session.ready ? () => api().preview(drawable, 1400) as Promise<PreviewImage> : null, [file, session.ready, JSON.stringify(drawable)], 250);
  const previewBlob = useMemo(() => (preview.result ? new Blob([preview.result.bytes as BlobPart], { type: 'image/png' }) : null), [preview.result]);
  const previewUrl = useObjectUrl(previewBlob);

  const current = items.find((a) => a.id === selected) ?? null;
  const update = (patch: Partial<Annotation>) => setItems((list) => list.map((a) => (a.id === selected ? ({ ...a, ...patch } as Annotation) : a)));

  const add = (kind: AnnotationKind) => {
    if (!info) return;
    if (items.length >= MAX_ANNOTATIONS) return setError(`You can add up to ${MAX_ANNOTATIONS} items.`);
    const a = newAnnotation(kind, nextId.current++, info.width, info.height);
    setItems((list) => [...list, a]);
    setSelected(a.id);
    setResult(null);
    setError(null);
  };

  // Dragging on the picture moves the selected item: areas take the whole box, text takes its top-left corner.
  const draw = (rect: Rect) => {
    if (!current) return;
    if (current.kind === 'pixelate' || current.kind === 'redact') update({ rect });
    else if (current.kind === 'text') update({ x: rect.x, y: rect.y });
  };

  const regions = items.flatMap((a) => {
    const rect = info ? annotationBounds(a, info.width, info.height) : null;
    return rect ? [{ rect, selected: a.id === selected, label: String(items.indexOf(a) + 1) }] : [];
  });

  const save = async () => {
    if (!file || !info || busy) return;
    setBusy(true);
    setError(null);
    try {
      for (const a of items) validateAnnotation(a, info.width, info.height);
      const { spec, format } = outputSpec(output, info.format);
      const out = (await api().save(items, spec)) as EncodedImage;
      setResult({ ...out, name: annotatedName(file.name, FORMATS[format].ext) });
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
      {info && session.ready && (
        <>
          <OptionsBar>
            {ADD.map(({ kind, label, icon: Icon }) => (
              <Button key={kind} onClick={() => add(kind)} testId={`add-${kind}`}>
                <Icon /> {label}
              </Button>
            ))}
          </OptionsBar>

          {items.length > 0 && (
            <ol className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Items on the picture" data-testid="annotation-list">
              {items.map((a, i) => (
                <li key={a.id} className={cn('flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm', a.id === selected && 'border-primary')}>
                  <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setSelected(a.id)} aria-pressed={a.id === selected}>
                    {i + 1}. {describeAnnotation(a)}
                  </button>
                  {problems.has(a.id) && <span className="text-xs text-destructive">{problems.get(a.id)}</span>}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setItems((list) => list.filter((x) => x.id !== a.id));
                      if (selected === a.id) setSelected(null);
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
          )}

          {current && (
            <OptionsBar>
              {(current.kind === 'text' || current.kind === 'watermark') && (
                <>
                  <TextInput label="Text" value={current.text} onChange={(text) => update({ text })} testId="annotation-text" className="w-56" />
                  <NumberInput label="Size (px)" value={current.size} onChange={(size) => update({ size })} min={4} max={2000} />
                  <Colour label="Colour" value={current.colour} onChange={(colour) => update({ colour })} />
                  <Slider label="Opacity" value={current.opacity} min={5} onChange={(opacity) => update({ opacity })} unit="%" />
                  <Checkbox label="Bold" checked={current.bold} onChange={(bold) => update({ bold })} />
                </>
              )}
              {current.kind === 'text' && (
                <>
                  <NumberInput label="Left (px)" value={current.x} onChange={(x) => update({ x })} min={0} max={info.width} />
                  <NumberInput label="Top (px)" value={current.y} onChange={(y) => update({ y })} min={0} max={info.height} />
                </>
              )}
              {current.kind === 'watermark' && <Slider label="Angle" value={current.angle} min={-90} max={90} onChange={(angle) => update({ angle })} unit="°" />}
              {current.kind === 'pixelate' && <Slider label="Block size" value={current.block} min={2} max={Math.max(20, Math.round(Math.max(current.rect.w, current.rect.h) / 2))} onChange={(block) => update({ block })} unit=" px" />}
              {current.kind === 'redact' && <Colour label="Cover colour" value={current.colour} onChange={(colour) => update({ colour })} />}
              {(current.kind === 'pixelate' || current.kind === 'redact') && <RectFields rect={current.rect} onChange={(rect) => update({ rect })} max={info} />}
            </OptionsBar>
          )}

          {previewUrl && preview.result ? (
            <RegionPicker
              src={previewUrl}
              width={info.width}
              height={info.height}
              regions={regions}
              onDraw={draw}
              label={current?.kind === 'text' ? 'Picture. Drag to place the text.' : current ? 'Picture. Drag to choose the area.' : 'Picture. Add an item, then drag on it.'}
            />
          ) : (
            <BusyLine busy={preview.busy} label="Preparing the picture…" />
          )}
          <ErrorBox error={preview.error} />

          <OptionsBar>
            <OutputControls value={output} onChange={setOutput} />
            <Button variant="primary" onClick={() => void save()} disabled={busy || items.length === 0 || problems.size > 0} testId="run">
              Save picture
            </Button>
          </OptionsBar>
        </>
      )}
      <BusyLine busy={busy} label="Saving…" />
      <ErrorBox error={error} />
      {result && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-info">
            {result.name}: {result.width}×{result.height} · {formatBytes(result.bytes.length)}
          </p>
          <ResultImage bytes={result.bytes} mime={result.mime} format={result.format} alt={`Annotated image: ${result.name}`} />
          <div>
            <DownloadButton data={new Blob([result.bytes as BlobPart], { type: result.mime })} filename={result.name} type={result.mime} label="Download" />
          </div>
        </section>
      )}
    </div>
  );
}
