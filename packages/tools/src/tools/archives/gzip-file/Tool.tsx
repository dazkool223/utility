import { useEffect, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { BusyLine, Button, DownloadButton, ErrorBox, FileDrop, FileList, KeyValueTable, OptionsBar, PaneTitle, Segmented } from '@/ui';
import { gunzipBlob, gzipBlob, isGzip, outputName, type GzipMode } from './logic';

interface Result {
  blob: Blob;
  name: string;
  mode: GzipMode;
  inputSize: number;
}

export default function GzipFile({ initialFiles }: ToolProps) {
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [mode, setMode] = useState<GzipMode>('compress');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A dropped .gz file most likely wants to be unpacked.
  useEffect(() => {
    if (!file) return;
    file.slice(0, 2).arrayBuffer().then((b) => setMode(isGzip(new Uint8Array(b)) ? 'decompress' : 'compress'));
  }, [file]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [file, mode]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const blob = mode === 'compress' ? await gzipBlob(file) : await gunzipBlob(file);
      setResult({ blob, name: outputName(file.name, mode), mode, inputSize: file.size });
    } catch (e) {
      setError(e instanceof ToolError ? e.message : 'The file could not be processed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="binary" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a file to gzip, or a .gz file to unpack" />
      ) : (
        <FileList files={[file]} onRemove={() => setFile(null)} />
      )}
      {file && (
        <>
          <OptionsBar>
            <Segmented
              label="Action"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'compress', label: 'Gzip' },
                { value: 'decompress', label: 'Gunzip' },
              ]}
            />
            <Button variant="primary" onClick={run} disabled={busy} testId="run">
              {busy ? 'Working…' : mode === 'compress' ? 'Compress' : 'Decompress'}
            </Button>
          </OptionsBar>
          <BusyLine busy={busy} label={mode === 'compress' ? 'Compressing…' : 'Decompressing…'} />
          <ErrorBox error={error} />
          {result && (
            <section className="flex flex-col gap-2">
              <div className="flex min-h-8 items-center gap-2">
                <PaneTitle>Result</PaneTitle>
                <span className="flex-1" />
                <DownloadButton data={result.blob} filename={result.name} type={result.blob.type} label={`Download ${result.name}`} />
              </div>
              <KeyValueTable
                rows={[
                  ['File', result.name],
                  ['Original size', formatBytes(result.inputSize)],
                  ['Output size', formatBytes(result.blob.size)],
                  [
                    'Ratio',
                    result.inputSize === 0
                      ? '-'
                      : result.mode === 'compress'
                        ? `${((result.blob.size / result.inputSize) * 100).toFixed(1)}% of original`
                        : `${(result.blob.size / result.inputSize).toFixed(1)}x expansion`,
                  ],
                ]}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
