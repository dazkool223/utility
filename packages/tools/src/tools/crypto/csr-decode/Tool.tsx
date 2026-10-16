import type { ToolProps } from '@/core/types';
import { DecoderTool } from '../_lib/DecoderTool';
import { describeCsr } from './logic';

export default function CsrDecodeTool({ initialInput }: ToolProps) {
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Paste a PEM certificate request (-----BEGIN CERTIFICATE REQUEST-----)…"
      decode={(s) => describeCsr(s).then((rows) => rows.map(([k, v]) => [k, <span key={k} className="whitespace-pre-wrap">{v}</span>]))}
    />
  );
}
