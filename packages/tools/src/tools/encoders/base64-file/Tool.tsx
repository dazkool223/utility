import { useEffect, useMemo, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { Button, CodeEditor, CopyButton, DownloadButton, downloadBlob, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Segmented, Select } from '@/ui';
import { extensionFor, formatOutput, parseBase64Input, type OutputStyle } from './logic';

const SHOW_LIMIT = 200_000;

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('The file could not be read.'));
    r.readAsDataURL(file);
  });
}

function FileToBase64({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [dataUri, setDataUri] = useState('');
  const [style, setStyle] = useState<OutputStyle>('data-uri');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDataUri('');
      return;
    }
    let cancelled = false;
    readAsDataUri(file).then(
      (uri) => {
        if (cancelled) return;
        // Browsers label unknown files "application/octet-stream" or "text/plain"; keep what the browser reports.
        setDataUri(uri.replace(/^data:;base64,/, 'data:application/octet-stream;base64,'));
        setError(null);
      },
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const output = useMemo(() => (dataUri ? formatOutput(dataUri, style) : ''), [dataUri, style]);
  const shown = output.length > SHOW_LIMIT ? output.slice(0, SHOW_LIMIT) + `\n… (${(output.length - SHOW_LIMIT).toLocaleString()} more characters; Copy and Download include everything)` : output;

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="binary" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a file or image here" />
      ) : (
        <FileList files={[file]} onRemove={() => setFile(null)} />
      )}
      {file && (
        <>
          <OptionsBar>
            <Select
              label="Output"
              value={style}
              onChange={setStyle}
              options={[
                { value: 'data-uri', label: 'Data URI' },
                { value: 'base64', label: 'Base64 only' },
                { value: 'css', label: 'CSS url()' },
                { value: 'html', label: 'HTML <img>' },
              ]}
            />
            <span className="text-sm text-muted-foreground">
              {file.type || 'unknown type'} · {formatBytes(file.size)} · Base64 is {formatBytes(Math.ceil((file.size * 4) / 3))}
            </span>
          </OptionsBar>
          <ErrorBox error={error} />
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <section className="flex min-w-0 flex-col gap-2">
              <div className="flex min-h-8 items-center gap-2">
                <PaneTitle>Output</PaneTitle>
                <span className="flex-1" />
                <DownloadButton data={output || null} filename="base64.txt" />
                <CopyButton text={output} primary />
              </div>
              <CodeEditor value={shown} readOnly label="Tool output" testId="tool-output" wrap />
            </section>
            {preview && (
              <section className="flex min-w-0 flex-col gap-2">
                <PaneTitle>Preview</PaneTitle>
                <div className="flex min-h-48 items-center justify-center rounded-lg border bg-card p-2">
                  <img src={preview} alt="Preview of the selected image" className="max-h-80 max-w-full object-contain" data-testid="image-preview" />
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Base64ToFile() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const parsed = useMemo(() => {
    if (!input.trim()) return { value: null, error: null as string | null };
    try {
      return { value: parseBase64Input(input), error: null };
    } catch (e) {
      return { value: null, error: e instanceof ToolError ? e.message : String(e) };
    }
  }, [input]);
  const result = parsed.value;

  useEffect(() => {
    if (!result || !result.mime.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: result.mime }));
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-2">
        <PaneTitle>Data URI or Base64</PaneTitle>
        <CodeEditor value={input} onChange={setInput} label="Base64 or data URI input" testId="tool-input" placeholder="Paste a data URI or Base64 here…" />
      </section>
      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-h-8 items-center gap-2">
          <PaneTitle>File</PaneTitle>
          <span className="flex-1" />
          <Button variant="primary" disabled={!result} onClick={() => result && downloadBlob(new Blob([result.bytes as BlobPart], { type: result.mime }), `file.${extensionFor(result.mime)}`, result.mime)}>
            Download file
          </Button>
        </div>
        <ErrorBox error={parsed.error} />
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-lg border bg-card p-3 text-sm" data-testid="tool-output">
          {result ? (
            <>
              {preview && <img src={preview} alt="Decoded image preview" className="max-h-80 max-w-full object-contain" data-testid="image-preview" />}
              <span className="text-muted-foreground">
                {result.mime} · {formatBytes(result.bytes.length)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">The decoded file appears here.</span>
          )}
        </div>
      </section>
    </div>
  );
}

export default function Base64File({ initialFiles }: ToolProps) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Segmented
          label="Direction"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'encode', label: 'File → Base64' },
            { value: 'decode', label: 'Base64 → File' },
          ]}
        />
      </div>
      {mode === 'encode' ? <FileToBase64 initialFiles={initialFiles} /> : <Base64ToFile />}
    </div>
  );
}
