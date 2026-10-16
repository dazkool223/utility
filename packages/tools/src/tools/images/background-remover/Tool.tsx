import { useEffect, useMemo, useRef, useState } from 'react';
import { proxy } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { BusyLine, Button, DownloadButton, ErrorBox, Field, FileDrop, OptionsBar, Segmented, useRunShortcut, useWorker } from '@/ui';
import { BeforeAfter } from '../_lib/components';
import { errorMessage, useObjectUrl } from '../_lib/hooks';
import { cutoutName, describeProgress, parseHexColor, type Progress } from './logic';

type Background = 'transparent' | 'color';

export default function BackgroundRemover({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [cut, setCut] = useState<Uint8Array | null>(null);
  const [background, setBackground] = useState<Background>('transparent');
  const [color, setColor] = useState('#ffffff');
  const [shown, setShown] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress>({ label: 'Starting…' });
  const [error, setError] = useState<string | null>(null);
  const job = useRef(0);

  const beforeUrl = useObjectUrl(file);
  const shownBlob = useMemo(() => (shown ? new Blob([shown as BlobPart], { type: 'image/png' }) : null), [shown]);
  const afterUrl = useObjectUrl(shownBlob);

  // The picture on screen is the cut-out itself, or the cut-out flattened onto the chosen colour.
  useEffect(() => {
    if (!cut) return setShown(null);
    if (background === 'transparent' || !parseHexColor(color)) return setShown(cut);
    let current = true;
    api()
      .flatten(cut, color)
      .then((png) => current && setShown(png as Uint8Array))
      .catch((e) => current && setError(errorMessage(e)));
    return () => {
      current = false;
    };
  }, [cut, background, color, api]);

  const run = async () => {
    if (!file || busy) return;
    const id = ++job.current;
    setBusy(true);
    setError(null);
    setCut(null);
    setProgress({ label: 'Starting…' });
    try {
      const png = (await api().cutout(
        await file.arrayBuffer(),
        file.type || 'image/png',
        proxy((key: string, current: number, total: number) => id === job.current && setProgress(describeProgress(key, current, total))),
      )) as Uint8Array;
      if (id === job.current) setCut(png);
    } catch (e) {
      if (id === job.current) setError(errorMessage(e));
    } finally {
      if (id === job.current) setBusy(false);
    }
  };
  useRunShortcut(() => void run());

  const choose = (f: File | null) => {
    job.current++;
    setFile(f);
    setCut(null);
    setError(null);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="image" accept="image/*" onFiles={(f) => choose(f[0] ?? null)} label="Drop a picture here" />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm" data-testid="image-source">
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
          <Button variant="ghost" onClick={() => choose(null)}>
            Remove
          </Button>
        </div>
      )}
      {file && (
        <>
          <OptionsBar>
            <Segmented
              label="Background"
              value={background}
              onChange={setBackground}
              options={[
                { value: 'transparent', label: 'Transparent' },
                { value: 'color', label: 'Solid colour' },
              ]}
            />
            {background === 'color' && (
              <Field label="Colour">
                {(id) => <input id={id} type="color" value={parseHexColor(color) ? color : '#ffffff'} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border bg-transparent" />}
              </Field>
            )}
            <Button variant="primary" onClick={() => void run()} disabled={busy}>
              Remove background
            </Button>
          </OptionsBar>
          <BusyLine busy={busy} label={progress.label} progress={progress.fraction} />
          <ErrorBox error={error} />
        </>
      )}
      {file && beforeUrl && afterUrl && shown && (
        <>
          <BeforeAfter before={beforeUrl} after={afterUrl} afterLabel="Without background" />
          <div className="flex items-center gap-3">
            <DownloadButton data={shownBlob} filename={cutoutName(file.name)} type="image/png" label="Download PNG" />
            <span className="text-xs text-muted-foreground" data-testid="result-info">
              PNG · {formatBytes(shown.byteLength)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
