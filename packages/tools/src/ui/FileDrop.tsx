import { useRef, useState, type DragEvent } from 'react';
import type { InputKind } from '../core/types';
import { formatBytes, sizeRestriction } from '../core/limits';
import { Upload } from 'lucide-react';
import { Button, RestrictionNotice } from './controls';
import { cn } from './lib/utils';

export interface FileDropProps {
  onFiles: (files: File[]) => void;
  /** `accept` attribute, e.g. "application/pdf" or "image/*". */
  accept?: string;
  multiple?: boolean;
  /** Which Supported Size applies. */
  kind: InputKind;
  label?: string;
}

/**
 * Drop zone + file picker. Files above the Supported Size trigger a Restriction notice;
 * the user may continue anyway (spec: "let the user still use the tool under restriction").
 */
export function FileDrop({ onFiles, accept, multiple, kind, label }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<{ files: File[]; message: string } | null>(null);

  const receive = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const total = files.reduce((n, f) => n + f.size, 0);
    const message = sizeRestriction(kind, total);
    if (message) setPending({ files, message });
    else onFiles(files);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    receive(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-card px-4 py-8 text-center transition-colors',
        over && 'border-brand bg-brand/5',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      data-testid="file-drop"
    >
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        data-testid="file-input"
        onChange={(e) => {
          receive(e.target.files);
          e.target.value = '';
        }}
      />
      {pending ? (
        <RestrictionNotice essential>
          <p className="mb-2">{pending.message}</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                onFiles(pending.files);
                setPending(null);
              }}
            >
              Continue anyway
            </Button>
            <Button onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </RestrictionNotice>
      ) : (
        <>
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm">{label ?? (multiple ? 'Drop files here' : 'Drop a file here')}</p>
          <Button variant="primary" onClick={() => input.current?.click()}>
            Choose {multiple ? 'files' : 'file'}
          </Button>
        </>
      )}
    </div>
  );
}

export function FileList({ files, onRemove }: { files: File[]; onRemove?: (index: number) => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm">
          <span className="flex-1 truncate">{f.name}</span>
          <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
          {onRemove && (
            <Button variant="ghost" onClick={() => onRemove(i)}>
              Remove
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
