import type { ToolProps } from '@/core/types';
import { DecoderTool, type Row } from '../_lib/DecoderTool';
import { decodeUuid } from './logic';

export default function UuidDecodeTool({ initialInput }: ToolProps) {
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Paste a UUID, e.g. 550e8400-e29b-41d4-a716-446655440000"
      decode={(s) => {
        const d = decodeUuid(s);
        const rows: Row[] = [
          ['UUID', d.canonical],
          ['Version', d.versionName],
          ['Variant', d.variant],
        ];
        if (d.timestamp) {
          rows.push(['Timestamp', d.timestamp.iso], ['Unix time (ms)', String(d.timestamp.ms)]);
        }
        if (d.clockSeq !== undefined) rows.push(['Clock sequence', String(d.clockSeq)]);
        if (d.node) rows.push(['Node', d.node]);
        if (d.randomHex) rows.push(['Random bits (hex)', d.randomHex]);
        return rows;
      }}
    />
  );
}
