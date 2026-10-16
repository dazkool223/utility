import type { ToolProps } from '@/core/types';
import { DecoderTool } from '../_lib/DecoderTool';
import { identifyHash } from './logic';

export default function HashIdentifyTool({ initialInput }: ToolProps) {
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Paste a hash…"
      decode={(s) => identifyHash(s).map((g, i): [string, string] => [i === 0 ? `${g.name} (most likely)` : g.name, g.note])}
      copyText={(rows) => rows.map(([k, v]) => `${k}: ${typeof v === 'string' ? v : ''}`).join('\n')}
    />
  );
}
