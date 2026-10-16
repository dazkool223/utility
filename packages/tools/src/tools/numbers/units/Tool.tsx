import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select } from '@/ui';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { CATEGORIES, convertAll, findCategory } from './logic';

export default function UnitsTool({ initialInput }: ToolProps) {
  const [category, setCategory] = useState('length');
  const [unit, setUnit] = useState('m');
  const cat = findCategory(category);
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="5 km, 72 °F, 1.5 GiB, 100 mph … or just a number"
      deps={[category, unit]}
      options={
        <OptionsBar>
          <Select
            label="Category (when no unit is typed)"
            value={category}
            onChange={(c) => {
              setCategory(c);
              setUnit(findCategory(c).units[0]!.id);
            }}
            options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select label="From unit" value={unit} onChange={setUnit} options={cat.units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }))} />
        </OptionsBar>
      }
      decode={(s) => {
        const r = convertAll(s, category, unit);
        return [['From', `${r.value} ${r.from.symbol} (${r.from.name})`], ...r.rows.map((x): [string, string] => [`${x.unit.name} (${x.unit.symbol})`, x.result])];
      }}
    />
  );
}
