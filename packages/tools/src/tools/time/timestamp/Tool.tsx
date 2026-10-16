import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, OptionsBar, Select, TextInput, TextTransform } from '@/ui';
import { localZone, type Unit } from '../_lib/dates';
import { convertTimestamps } from './logic';

export default function TimestampTool({ initialInput }: ToolProps) {
  const [zone, setZone] = useState('');
  const [force, setForce] = useState<Unit | 'auto'>('auto');
  const [tick, setTick] = useState(0);
  const modes = useMemo(
    () => [{ id: 'convert', label: 'Convert', run: (s: string) => convertTimestamps(s, { zone, force }, Date.now()), filename: 'timestamps.txt' }],
    // `tick` re-runs the conversion so "now" and relative times refresh on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zone, force, tick],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      inputPlaceholder="A Unix timestamp, a date, or the word now…"
      options={
        <OptionsBar>
          <Select
            label="Timestamp unit"
            value={force}
            onChange={setForce}
            options={[
              { value: 'auto', label: 'Detect automatically' },
              { value: 's', label: 'Seconds' },
              { value: 'ms', label: 'Milliseconds' },
              { value: 'us', label: 'Microseconds' },
              { value: 'ns', label: 'Nanoseconds' },
            ]}
          />
          <TextInput label={`Time zone (default ${localZone()})`} value={zone} onChange={setZone} placeholder="America/New_York" monospace className="w-56" />
          <Button onClick={() => setTick((t) => t + 1)} title="Recalculate relative times">
            Refresh
          </Button>
        </OptionsBar>
      }
    />
  );
}
