import type { ToolProps } from '@/core/types';
import { DecoderTool } from '../_lib/DecoderTool';
import { describeCertificates } from './logic';

export default function X509Tool({ initialInput }: ToolProps) {
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Paste a PEM certificate (-----BEGIN CERTIFICATE-----)…"
      decode={(s) => describeCertificates(s).then((rows) => rows.map(([k, v]) => [k, v === '' ? <strong key={k}>{k}</strong> : <span className="whitespace-pre-wrap">{v}</span>]))}
    />
  );
}
