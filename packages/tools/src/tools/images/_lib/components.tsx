import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { formatBytes, SUPPORTED_IMAGE_PIXELS } from '@/core/limits';
import { Button, ErrorBox, FileDrop, RestrictionNotice } from '@/ui';
import { FORMATS, type RasterFormat, type SniffedFormat } from './formats';
import { rectFromDrag, type Rect } from './pixels';
import { useObjectUrl, type SessionState } from './hooks';

const ACCEPT = 'image/*,.avif,.jxl,.qoi,.webp';

const formatLabel = (f: SniffedFormat) => (f === 'unknown' ? 'image' : f in FORMATS ? FORMATS[f as RasterFormat].label : f.toUpperCase());

/** Drop zone, then a one-line summary of the chosen image, with the 50-megapixel Restriction gate. */
export function ImageSource({ file, onFile, session, label = 'Drop an image here' }: { file: File | null; onFile: (f: File | null) => void; session: SessionState; label?: string }) {
  if (!file) return <FileDrop kind="image" accept={ACCEPT} onFiles={(f) => onFile(f[0] ?? null)} label={label} />;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm" data-testid="image-source">
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground" data-testid="image-info">
          {session.status === 'loading' && 'Reading…'}
          {session.info && `${formatLabel(session.info.format)} · ${session.info.width}×${session.info.height} · ${formatBytes(file.size)}`}
        </span>
        <Button variant="ghost" onClick={() => onFile(null)}>
          Remove
        </Button>
      </div>
      <ErrorBox error={session.error} />
      {session.info && session.large && !session.ready && (
        <RestrictionNotice essential>
          <p className="mb-2">
            This image is {((session.info.width * session.info.height) / 1_000_000).toFixed(1)} megapixels. This Tool is tested up to {SUPPORTED_IMAGE_PIXELS / 1_000_000} megapixels; larger images may be slow or run out of memory.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={session.confirm}>
              Continue anyway
            </Button>
            <Button onClick={() => onFile(null)}>Cancel</Button>
          </div>
        </RestrictionNotice>
      )}
    </div>
  );
}

/** Shows image bytes made by a worker. Formats this browser cannot display get a plain note instead. */
export function ResultImage({ bytes, mime, alt, format }: { bytes: Uint8Array | null; mime: string; alt: string; format?: RasterFormat }) {
  const blob = useMemo(() => (bytes ? new Blob([bytes as BlobPart], { type: mime }) : null), [bytes, mime]);
  const url = useObjectUrl(blob);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!bytes) return null;
  if (failed) {
    return (
      <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground" data-testid="preview-unavailable">
        This browser can&apos;t show {format ? FORMATS[format].label : 'this format'} images, so there is no preview. Download the file to open it in a viewer that supports it.
      </p>
    );
  }
  return url ? <img src={url} alt={alt} onError={() => setFailed(true)} className="max-h-96 max-w-full rounded border bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] object-contain" data-testid="image-preview" /> : null;
}

/** Before/after slider: drag the handle (or use arrow keys on the slider) to reveal the original. */
export function BeforeAfter({ before, after, beforeLabel = 'Before', afterLabel = 'After' }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="flex flex-col gap-2" data-testid="before-after">
      <div className="relative overflow-hidden rounded-lg border bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
        <img src={after} alt={afterLabel} className="block max-h-[28rem] w-full object-contain" data-testid="after-image" />
        <img src={before} alt={beforeLabel} className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} data-testid="before-image" />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${pos}%` }} />
        <span className="absolute top-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-xs">{beforeLabel}</span>
        <span className="absolute top-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs">{afterLabel}</span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(e.target.valueAsNumber)} aria-label="Before and after comparison position" className="w-full" />
    </div>
  );
}

export interface RegionOverlay {
  rect: Rect;
  selected?: boolean;
  label?: string;
}

/**
 * An image you can drag a rectangle over. Coordinates are in image pixels (`width`×`height`), whatever size the
 * picture is drawn at. Numeric fields next to it are the keyboard-accessible way to set the same values.
 */
export function RegionPicker({
  src,
  width,
  height,
  regions,
  onDraw,
  aspect,
  label,
  children,
}: {
  src: string;
  width: number;
  height: number;
  regions: readonly RegionOverlay[];
  onDraw: (rect: Rect) => void;
  aspect?: number | null;
  label: string;
  children?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const toImage = (e: ReactPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * width, y: ((e.clientY - r.top) / r.height) * height };
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={box}
        role="img"
        aria-label={label}
        data-testid="region-picker"
        className="relative inline-block max-w-full cursor-crosshair touch-none self-start select-none overflow-hidden rounded-lg border bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = toImage(e);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const r = rectFromDrag(start.current, toImage(e), width, height, aspect);
          if (r) onDraw(r);
        }}
        onPointerUp={() => (start.current = null)}
        onPointerCancel={() => (start.current = null)}
      >
        <img src={src} alt="" draggable={false} className="block max-h-[28rem] max-w-full" data-testid="picker-image" />
        {regions.map((r, i) => (
          <div
            key={i}
            className={`pointer-events-none absolute border-2 ${r.selected ? 'border-primary bg-primary/20' : 'border-muted-foreground bg-muted-foreground/10'}`}
            style={{ left: `${(r.rect.x / width) * 100}%`, top: `${(r.rect.y / height) * 100}%`, width: `${(r.rect.w / width) * 100}%`, height: `${(r.rect.h / height) * 100}%` }}
            data-testid={r.selected ? 'region-selected' : 'region'}
          >
            {r.label && <span className="absolute -top-0.5 -left-0.5 bg-primary px-1 text-[10px] text-primary-foreground">{r.label}</span>}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

/** x / y / width / height number fields for a region. */
export function RectFields({ rect, onChange, max }: { rect: Rect; onChange: (r: Rect) => void; max: { width: number; height: number } }) {
  const field = (key: keyof Rect, label: string, limit: number) => (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="number"
        className="h-8 w-24 rounded-md border bg-background px-2 text-sm text-foreground"
        value={rect[key]}
        min={key === 'w' || key === 'h' ? 1 : 0}
        max={limit}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (!Number.isNaN(n)) onChange({ ...rect, [key]: Math.max(key === 'w' || key === 'h' ? 1 : 0, Math.min(limit, Math.round(n))) });
        }}
      />
    </label>
  );
  return (
    <div className="flex flex-wrap items-end gap-3">
      {field('x', 'Left (px)', max.width)}
      {field('y', 'Top (px)', max.height)}
      {field('w', 'Width (px)', max.width)}
      {field('h', 'Height (px)', max.height)}
    </div>
  );
}

/** Labelled range slider with the current value shown. */
export function Slider({ label, value, onChange, min = 1, max = 100, step = 1, unit = '', testId }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; testId?: string }) {
  const id = useId();
  return (
    <div className="flex min-w-48 flex-col gap-1.5">
      <label htmlFor={id} className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono text-foreground">
          {value}
          {unit}
        </span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.valueAsNumber)} className="h-8 w-full" data-testid={testId} />
    </div>
  );
}
