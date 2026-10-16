import { useMemo, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, Checkbox, CodeEditor, CopyButton, ErrorBox, NumberInput, OptionsBar, PaneTitle, Select, TextInput, useToolMeta } from '@/ui';
import { formatInZone, localZone } from '../_lib/dates';
import { analyzeCron, cronReport, DIALECTS, PRESETS, presetFor, type CronDialect, type CronResult } from './logic';

export default function CronTool({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [expr, setExpr] = useState(initialInput);
  const [dialect, setDialect] = useState<CronDialect>('unix');
  const [zone, setZone] = useState('');
  const [count, setCount] = useState(10);
  const [use24h, setUse24h] = useState(false);
  const info = DIALECTS.find((d) => d.value === dialect)!;
  const opts = { dialect, zone, count, use24h };

  const result = useMemo(() => {
    if (!expr.trim()) return { value: null as CronResult | null, error: null as string | null };
    try {
      return { value: analyzeCron(expr, opts), error: null };
    } catch (e) {
      return { value: null, error: e instanceof ToolError ? e.message : String(e) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opts is rebuilt from these values each render
  }, [expr, dialect, zone, count, use24h]);

  const parts = expr.trim() ? expr.trim().split(/\s+/) : [];
  const fieldValue = (i: number) => (parts.length === info.fields.length || (dialect === 'quartz' && parts.length === 6) ? (parts[i] ?? '') : '');
  const setField = (i: number, v: string) => {
    const next = info.fields.map((_, k) => (k === i ? v : parts.length === info.fields.length ? (parts[k] ?? '*') : '*'));
    setExpr((dialect === 'quartz' && next[6] === '' ? next.slice(0, 6) : next).map((x) => x || '*').join(' '));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        {meta?.example && (
          <Button variant="ghost" onClick={() => setExpr(meta.example!.input)}>
            Sample
          </Button>
        )}
        <Button variant="ghost" onClick={() => setExpr('')} disabled={!expr}>
          Clear
        </Button>
      </div>
      <OptionsBar>
        <Select label="Cron dialect" value={dialect} onChange={setDialect} options={DIALECTS.map((d) => ({ value: d.value, label: d.label }))} />
        <TextInput label={`Time zone (default ${localZone()})`} value={zone} onChange={setZone} placeholder="UTC" monospace className="w-48" />
        <NumberInput label="Next runs" value={count} onChange={setCount} min={1} max={50} />
        <Checkbox label="24-hour times" checked={use24h} onChange={setUse24h} />
        <Select
          label="Start from a preset"
          value=""
          onChange={(v) => {
            const p = PRESETS.find((x) => x.label === v);
            if (p) setExpr(presetFor(p, dialect));
          }}
          options={[{ value: '', label: 'Choose…' }, ...PRESETS.map((p) => ({ value: p.label, label: p.label }))]}
        />
      </OptionsBar>
      <p className="m-0 text-xs text-muted-foreground">{info.hint}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-2">
            <PaneTitle>Cron expression</PaneTitle>
            <CodeEditor value={expr} onChange={setExpr} label="Tool input" testId="tool-input" placeholder="*/5 * * * *" wrap={false} className="h-20 min-h-0" />
          </div>
          <div className="flex flex-col gap-2">
            <PaneTitle>Builder</PaneTitle>
            <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
              {info.fields.map((name, i) => (
                <div key={name} className="w-28">
                  <TextInput label={name} value={fieldValue(i)} onChange={(v) => setField(i, v)} monospace placeholder="*" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Meaning and next runs</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={result.value ? cronReport(expr, opts) : ''} label="Copy report" />
          </div>
          <ErrorBox error={result.error} />
          <div className="flex min-h-48 flex-col gap-3 rounded-lg border bg-card p-3" data-testid="tool-output">
            {result.value ? (
              <>
                <p className="m-0 text-lg font-semibold">{result.value.description}</p>
                {result.value.notes.map((n) => (
                  <p key={n} className="m-0 text-sm text-muted-foreground">
                    {n}
                  </p>
                ))}
                {result.value.runs.length > 0 && (
                  <ol className="m-0 flex list-none flex-col gap-1 p-0 font-mono text-sm">
                    {result.value.runs.map((d, i) => (
                      <li key={i} className="flex flex-wrap gap-x-3">
                        <span className="w-6 text-right text-muted-foreground">{i + 1}.</span>
                        <span>{formatInZone(d, result.value!.zone)}</span>
                        <span className="text-muted-foreground">{d.toISOString()}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">Enter an expression or pick a preset.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
