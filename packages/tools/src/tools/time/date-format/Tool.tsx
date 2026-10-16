import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, TextInput, TextTransform } from '@/ui';
import { localZone } from '../_lib/dates';
import { formatDates, PATTERN_HELP } from './logic';

export default function DateFormatTool({ initialInput }: ToolProps) {
  const [zone, setZone] = useState('');
  const [inputPattern, setInputPattern] = useState('');
  const [outputPattern, setOutputPattern] = useState('');
  const modes = useMemo(() => [{ id: 'format', label: 'Format', run: (s: string) => formatDates(s, { zone, inputPattern, outputPattern }), filename: 'dates.txt' }], [zone, inputPattern, outputPattern]);
  return (
    <div className="flex flex-col gap-3">
      <TextTransform
        modes={modes}
        initialInput={initialInput}
        inputPlaceholder="A date in almost any format, a Unix timestamp, or the word now…"
        options={
          <OptionsBar>
            <TextInput label={`Time zone (default ${localZone()})`} value={zone} onChange={setZone} placeholder="UTC" monospace className="w-48" />
            <TextInput label="Input format (optional)" value={inputPattern} onChange={setInputPattern} placeholder="dd/MM/yyyy HH:mm" monospace className="w-56" />
            <TextInput label="Custom output format" value={outputPattern} onChange={setOutputPattern} placeholder="EEEE, d MMMM yyyy" monospace className="w-56" />
          </OptionsBar>
        }
      />
      <p className="m-0 text-xs text-muted-foreground">Format tokens: {PATTERN_HELP}. Text in single quotes is kept as is.</p>
    </div>
  );
}
