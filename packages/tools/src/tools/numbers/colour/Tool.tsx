import type { ToolProps } from '@/core/types';
import { Field } from '@/ui';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { describeColour } from './logic';

export default function ColourTool({ initialInput }: ToolProps) {
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="#ff6600, rgb(255 102 0), hsl(24 100% 50%), oklch(0.7 0.18 50), rebeccapurple…"
      options={({ input, setInput }) => {
        let hex = '#000000';
        try {
          hex = describeColour(input).hex;
        } catch {
          /* keep the default */
        }
        return (
          <div className="flex items-end gap-3 rounded-lg border bg-card p-3">
            <Field label="Pick a colour">{(id) => <input id={id} type="color" className="h-8 w-14 cursor-pointer rounded border bg-transparent" value={hex} onChange={(e) => setInput(e.target.value)} />}</Field>
          </div>
        );
      }}
      decode={(s) => {
        const r = describeColour(s);
        return [
          ['Swatch', <span key="sw" className="inline-block h-10 w-full min-w-24 rounded border" style={{ backgroundColor: r.hex, opacity: r.alpha }} role="img" aria-label={`Swatch of ${r.hex}`} />],
          ...r.rows,
        ];
      }}
    />
  );
}
