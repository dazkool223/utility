import { useEffect, useState } from 'react';
import { formatBytes } from '@/core/limits';
import { ToolError, type ToolProps } from '@/core/types';
import { BusyLine, Button, Checkbox, DownloadButton, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, TextInput, useRunShortcut } from '@/ui';
import {
  AUDIO_FORMATS,
  availableFormats,
  convertAudio,
  DEFAULT_AUDIO_OPTIONS,
  parseTime,
  type AudioConvertOptions,
  type AudioConvertResult,
  type AudioFormatId,
  type ChannelMode,
} from './logic';

const SAMPLE_RATES = ['keep', '8000', '22050', '44100', '48000'] as const;

function seconds(label: string, text: string): number | null {
  const v = parseTime(text);
  if (v !== null && Number.isNaN(v)) throw new ToolError(`${label} must look like 90, 1:30 or 0:01:30.5.`);
  return v;
}

export default function AudioConvertTool({ initialFiles }: ToolProps) {
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [formats, setFormats] = useState<AudioFormatId[]>(['mp3', 'wav', 'flac']);
  const [opts, setOpts] = useState<AudioConvertOptions>(DEFAULT_AUDIO_OPTIONS);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AudioConvertResult | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    void availableFormats().then(setFormats, () => undefined);
  }, []);
  useEffect(() => {
    if (!result) return setUrl(null);
    const u = URL.createObjectURL(result.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [result]);

  const set = <K extends keyof AudioConvertOptions>(key: K, value: AudioConvertOptions[K]) => setOpts((o) => ({ ...o, [key]: value }));
  const spec = AUDIO_FORMATS[opts.format];

  const run = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const options = { ...opts, trimStart: seconds('The start time', start) ?? 0, trimEnd: seconds('The end time', end) };
      setResult(await convertAudio(file, file.name, options, setProgress));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  useRunShortcut(() => void run());

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="media" accept="audio/*,video/*,.mkv,.mka,.flac,.aac,.m4a,.opus,.ogg,.mov" onFiles={(f) => { setFile(f[0] ?? null); setResult(null); setError(null); }} label="Drop an audio or video file here" />
      ) : (
        <FileList files={[file]} onRemove={() => { setFile(null); setResult(null); setError(null); }} />
      )}
      <OptionsBar>
        <Select label="Convert to" value={opts.format} onChange={(v) => set('format', v)} options={formats.map((f) => ({ value: f, label: AUDIO_FORMATS[f].label }))} />
        {spec.lossy && (
          <Select
            label="Bitrate"
            value={String(opts.bitrateKbps)}
            onChange={(v) => set('bitrateKbps', Number(v))}
            options={[64, 96, 128, 160, 192, 256, 320].map((b) => ({ value: String(b), label: `${b} kbps` }))}
          />
        )}
        <Select
          label="Sample rate"
          value={opts.sampleRate ? String(opts.sampleRate) : 'keep'}
          onChange={(v) => set('sampleRate', v === 'keep' ? null : Number(v))}
          options={SAMPLE_RATES.map((r) => ({ value: r, label: r === 'keep' ? 'Same as source' : `${Number(r).toLocaleString()} Hz` }))}
        />
        <Select
          label="Channels"
          value={opts.channels}
          onChange={(v: ChannelMode) => set('channels', v)}
          options={[
            { value: 'keep', label: 'Same as source' },
            { value: 'mono', label: 'Mono' },
            { value: 'stereo', label: 'Stereo' },
          ]}
        />
        <TextInput label="Trim from (optional)" value={start} onChange={setStart} placeholder="0:00" testId="trim-start" className="w-28" />
        <TextInput label="Trim to (optional)" value={end} onChange={setEnd} placeholder="end" testId="trim-end" className="w-28" />
        <Checkbox label="Keep tags and cover art" checked={opts.keepTags} onChange={(v) => set('keepTags', v)} />
        <Button variant="primary" onClick={() => void run()} disabled={!file || busy} testId="run">
          Convert
        </Button>
      </OptionsBar>
      <BusyLine busy={busy} label={`Converting to ${spec.label}…`} progress={progress} />
      <ErrorBox error={error} />
      {result && url && (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="tool-output" aria-label="Result">
          <PaneTitle>Result</PaneTitle>
          <p className="m-0 text-sm" data-testid="result-summary">
            {result.name}: {formatBytes(result.blob.size)}
            {result.durationSec !== null && `, ${result.durationSec.toFixed(1)} s`}
          </p>
          <audio controls src={url} className="w-full max-w-md" />
          <div>
            <DownloadButton data={result.blob} filename={result.name} type={result.blob.type} label={`Download ${result.name}`} />
          </div>
        </section>
      )}
    </div>
  );
}
