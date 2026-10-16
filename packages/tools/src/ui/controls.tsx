import { useEffect, useId, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, ChevronDown, Copy, Download, Loader2 } from 'lucide-react';
import { TOOL_EVENTS } from '../core/host';
import { Button as ShadButton } from './shadcn/button';
import { Input } from './shadcn/input';
import { Label } from './shadcn/label';
import { Checkbox as ShadCheckbox } from './shadcn/checkbox';
import { NativeSelect, NativeSelectOption } from './shadcn/native-select';
import { ToggleGroup, ToggleGroupItem } from './shadcn/toggle-group';
import { Alert, AlertDescription } from './shadcn/alert';
import { cn } from './lib/utils';

/** Thin wrapper over shadcn Button with the variants Tools need. */
export function Button({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  title,
  testId,
  type = 'button',
  size = 'sm',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  title?: string;
  testId?: string;
  type?: 'button' | 'submit';
  size?: 'sm' | 'default';
}) {
  const v = variant === 'primary' ? 'default' : variant === 'secondary' ? 'outline' : variant;
  return (
    <ShadButton type={type} variant={v} size={size} onClick={onClick} disabled={disabled} title={title} data-testid={testId}>
      {children}
    </ShadButton>
  );
}

/** Row of options above the panes. */
export function OptionsBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-3">{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {children(id)}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <NativeSelect id={id} size="sm" value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
    </Field>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex h-8 items-center gap-2">
      <ShadCheckbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <Input
          id={id}
          type="number"
          className="h-8 w-28"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (!Number.isNaN(n)) onChange(min !== undefined && n < min ? min : max !== undefined && n > max ? max : n);
          }}
        />
      )}
    </Field>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  testId,
  monospace,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testId?: string;
  monospace?: boolean;
  className?: string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <Input
          id={id}
          type="text"
          className={cn('h-8', monospace && 'font-mono', className)}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          data-testid={testId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/** Segmented control for a small set of mutually exclusive modes. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive" role="alert" data-testid="tool-error">
      <AlertTriangle />
      <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
    </Alert>
  );
}

/**
 * Restriction notice. Collapsed behind a one-line summary unless the user must act on it or would be
 * misled without it (`essential`), so routine heads-ups do not crowd the Tool.
 */
export function RestrictionNotice({ children, essential = false }: { children: ReactNode; essential?: boolean }) {
  if (essential)
    return (
      <div className="flex items-start gap-2 rounded-lg bg-warning px-3 py-2 text-sm text-warning-foreground" data-testid="restriction">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">{children}</div>
      </div>
    );
  return (
    <details className="group rounded-lg bg-warning text-sm text-warning-foreground" data-testid="restriction">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 select-none">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="flex-1">Heads-up</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-2 pl-9">{children}</div>
    </details>
  );
}

/** A Tool's declared Restrictions, in one collapsed container. */
export function RestrictionNotes({ messages }: { messages: readonly string[] }) {
  if (!messages.length) return null;
  return (
    <details className="group rounded-lg bg-warning text-sm text-warning-foreground" data-testid="restrictions">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 select-none">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="flex-1">Good to know before you start ({messages.length})</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="flex list-disc flex-col gap-1.5 px-3 pb-2.5 pl-9">
        {messages.map((m) => (
          <li key={m} data-testid="restriction">
            {m}
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Shown while a Tool works: spinner, what it is doing, and how long it has been going (after a couple of seconds),
 * plus a progress bar when the Tool can report one (`progress` 0–1).
 */
export function BusyLine({ busy, label, progress }: { busy: boolean; label: string; progress?: number }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!busy) return;
    setSeconds(0);
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy, label]);
  if (!busy) return null;
  return (
    <div className="flex items-center gap-3 text-sm" role="status" data-testid="busy">
      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      {progress !== undefined && <progress className="h-2 w-64" value={progress} max={1} aria-label={label} />}
      <span>{label}</span>
      {seconds >= 2 && <span className="text-xs text-muted-foreground tabular-nums">{seconds}s</span>}
    </div>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy button. When `primary`, it also answers the global Copy-output shortcut (Ctrl/⌘ Shift C). */
export function CopyButton({ text, label = 'Copy', primary = false }: { text: string; label?: string; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    if (!text) return;
    const ok = await copyText(text);
    setState(ok ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 1500);
  };
  useEffect(() => {
    if (!primary) return;
    const handler = () => void copy();
    window.addEventListener(TOOL_EVENTS.copyOutput, handler);
    return () => window.removeEventListener(TOOL_EVENTS.copyOutput, handler);
  });
  return (
    <Button onClick={copy} disabled={!text} title={primary ? 'Copy output (Ctrl/⌘ Shift C)' : undefined} testId={primary ? 'copy-output' : undefined}>
      {state === 'copied' ? <Check /> : <Copy />}
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
    </Button>
  );
}

export function downloadBlob(data: Blob | string, filename: string, type = 'text/plain;charset=utf-8') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function DownloadButton({ data, filename, type, label = 'Download' }: { data: Blob | string | null; filename: string; type?: string; label?: string }) {
  return (
    <Button onClick={() => data !== null && downloadBlob(data, filename, type)} disabled={data === null || data === ''}>
      <Download />
      {label}
    </Button>
  );
}

/** Runs `fn` when the global Run shortcut (Ctrl/⌘ Enter) fires. */
export function useRunShortcut(fn: () => void) {
  useEffect(() => {
    window.addEventListener(TOOL_EVENTS.run, fn);
    return () => window.removeEventListener(TOOL_EVENTS.run, fn);
  }, [fn]);
}

/** Read-only key/value result table for decoders and calculators. */
export function KeyValueTable({ rows, testId = 'tool-output' }: { rows: ReadonlyArray<[string, ReactNode]>; testId?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" data-testid={testId}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <th className="w-1/3 px-3 py-2 text-left align-top font-normal text-muted-foreground">{k}</th>
              <td className="px-3 py-2 font-mono break-all">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Section heading used for panes. */
export function PaneTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</h2>;
}
