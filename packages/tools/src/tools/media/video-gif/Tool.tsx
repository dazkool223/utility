import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, Button, Checkbox, DownloadButton, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, TextInput, useRunShortcut } from '@/ui';
import { DEFAULT_GIF_OPTIONS, FPS_CHOICES, makeGif, parseTime, WIDTH_CHOICES, type GifOptions, type GifResult } from './logic';

function seconds(label: string, text: string): number | null {
  const v = parseTime(text);
  if (v !== null && Number.isNaN(v)) throw new Error(`${label} must look like 90, 1:30 or 0:01:30.5.`);
  return v;
}

export default function VideoGifTool({ initialFiles }: ToolProps) {
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [opts, setOpts] = useState<GifOptions>(DEFAULT_GIF_OPTIONS);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GifResult | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef({ cancelled: false });

  useEffect(() => {
    if (!result) return setUrl(null);
    const u = URL.createObjectURL(result.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [result]);
  useEffect(
    () => () => {
      current.current.cancelled = true;
    },
    [],
  );

  const set = <K extends keyof GifOptions>(key: K, value: GifOptions[K]) => setOpts((o) => ({ ...o, [key]: value }));

  const run = async () => {
    if (!file || busy) return;
    const token = { cancelled: false };
    current.current = token;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const options = { ...opts, start: seconds('The start time', start) ?? 0, end: seconds('The end time', end) };
      const made = await makeGif(file, file.name, options, (p) => !token.cancelled && setProgress(p), token);
      if (!token.cancelled) setResult(made);
    } catch (e) {
      if (!token.cancelled) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!token.cancelled) setBusy(false);
    }
  };
  useRunShortcut(() => void run());

  const reset = () => {
    current.current.cancelled = true;
    setBusy(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop
          kind="media"
          accept="video/*,.mkv,.mov"
          onFiles={(f) => {
            reset();
            setFile(f[0] ?? null);
          }}
          label="Drop a video here"
        />
      ) : (
        <FileList
          files={[file]}
          onRemove={() => {
            reset();
            setFile(null);
          }}
        />
      )}
      <OptionsBar>
        <Select label="Width" value={String(opts.width)} onChange={(v) => set('width', Number(v))} options={WIDTH_CHOICES.map((w) => ({ value: String(w), label: `${w} px` }))} />
        <Select label="Frame rate" value={String(opts.fps)} onChange={(v) => set('fps', Number(v))} options={FPS_CHOICES.map((f) => ({ value: String(f), label: `${f} fps` }))} />
        <Select
          label="Colours"
          value={String(opts.colours)}
          onChange={(v) => set('colours', Number(v))}
          options={[256, 128, 64, 32].map((c) => ({ value: String(c), label: `${c}${c === 256 ? ' (best)' : ''}` }))}
        />
        <TextInput label="From (optional)" value={start} onChange={setStart} placeholder="0:00" testId="gif-start" className="w-28" />
        <TextInput label="To (optional)" value={end} onChange={setEnd} placeholder="end" testId="gif-end" className="w-28" />
        <Checkbox label="Play once" checked={opts.playOnce} onChange={(v) => set('playOnce', v)} />
        <Button variant="primary" onClick={() => void run()} disabled={!file || busy} testId="run">
          Make GIF
        </Button>
      </OptionsBar>
      <BusyLine busy={busy} label="Reading frames and building the GIF…" progress={progress} />
      <ErrorBox error={error} />
      {result && url && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-summary">
            {result.name}: {result.width}×{result.height}, {result.frames} frames, {formatBytes(result.blob.size)}
            {result.truncated && ' (cut short at 600 frames)'}
          </p>
          <img src={url} alt="The finished GIF" className="max-h-96 max-w-full self-start rounded border" data-testid="image-preview" />
          <div>
            <DownloadButton data={result.blob} filename={result.name} type="image/gif" label={`Download ${result.name}`} />
          </div>
        </section>
      )}
    </div>
  );
}
