import type { ToolProps } from '@/core/types';
import { TwoInputTool } from '@/tools/text/_lib/TwoInputTool';
import { diffJson, formatChanges, type Change } from './logic';

const SAMPLE = { a: '{"name":"utility","version":1,"tags":["a","b"]}', b: '{"name":"utility","version":2,"tags":["a","c"],"ok":true}' };

const tone: Record<Change['kind'], string> = {
  added: 'bg-brand/10',
  removed: 'bg-destructive/10 text-destructive',
  changed: 'bg-warning text-warning-foreground',
  moved: 'bg-accent',
};

function compute(a: string, b: string) {
  const changes = diffJson(a, b);
  const text = formatChanges(changes);
  const lines = text.split('\n');
  return {
    text,
    view: (
      <div className="flex flex-col gap-1">
        {changes.length === 0 ? (
          <span>No differences</span>
        ) : (
          changes.map((c, i) => (
            <div key={i} className={`rounded px-2 py-0.5 break-all ${tone[c.kind]}`}>
              {lines[i]}
            </div>
          ))
        )}
      </div>
    ),
  };
}

export default function JsonDiff({ initialInput }: ToolProps) {
  return <TwoInputTool labelA="Original JSON" labelB="Changed JSON" languageA="json" languageB="json" compute={compute} initialInput={initialInput} sample={SAMPLE} filename="diff.txt" />;
}
