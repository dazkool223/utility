import { useMemo, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, PaneTitle, SendTo, useToolMeta } from '@/ui';
import { decodeJwtToken, jwtReport, pretty, relativeTime, type DecodedJwt } from './logic';

const BADGE: Record<DecodedJwt['expiry'], { text: string; className: string } | null> = {
  expired: { text: 'Expired', className: 'bg-destructive/10 text-destructive' },
  valid: { text: 'Not expired', className: 'bg-brand/10 text-brand' },
  'not-yet-valid': { text: 'Not valid yet', className: 'bg-warning text-warning-foreground' },
  none: null,
};

function Block({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <PaneTitle>{title}</PaneTitle>
        <span className="flex-1" />
        <CopyButton text={text} label={`Copy ${title.toLowerCase()}`} />
      </div>
      <pre className="m-0 overflow-auto rounded-lg border bg-card p-3 font-mono text-sm break-all whitespace-pre-wrap">{text}</pre>
    </section>
  );
}

export default function JwtDecode({ initialInput = '' }: ToolProps) {
  const meta = useToolMeta();
  const [input, setInput] = useState(initialInput);
  const result = useMemo(() => {
    if (!input.trim()) return { decoded: null as DecodedJwt | null, error: null as string | null };
    try {
      return { decoded: decodeJwtToken(input), error: null };
    } catch (e) {
      return { decoded: null, error: e instanceof ToolError ? e.message : String(e) };
    }
  }, [input]);
  const d = result.decoded;
  const badge = d ? BADGE[d.expiry] : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1" />
        {meta?.example && (
          <Button variant="ghost" onClick={() => setInput(meta.example!.input)}>
            Sample
          </Button>
        )}
        <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
          Clear
        </Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>Token</PaneTitle>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="Paste a JWT here…" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Decoded</PaneTitle>
            <span className="flex-1" />
            {d && <SendTo text={pretty(d.payload)} />}
            {d && <CopyButton primary text={jwtReport(input)} label="Copy report" />}
          </div>
          <ErrorBox error={result.error} />
          <div className="flex max-h-[70vh] min-h-72 flex-col gap-3 overflow-auto" data-testid="tool-output">
            {d && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {badge && (
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge.className}`} data-testid="jwt-status">
                      {badge.text}
                    </span>
                  )}
                  {d.alg && <span className="rounded-full bg-accent px-3 py-1 text-sm">alg: {d.alg}</span>}
                  {d.alg?.toLowerCase() === 'none' && <span className="rounded-full bg-warning px-3 py-1 text-sm text-warning-foreground">Unsigned token</span>}
                </div>
                <Block title="Header" text={pretty(d.header)} />
                <Block title="Payload" text={pretty(d.payload)} />
                {d.claims.length > 0 && (
                  <section className="flex flex-col gap-1">
                    <PaneTitle>Times</PaneTitle>
                    <div className="overflow-hidden rounded-lg border bg-card">
                      <table className="w-full text-sm">
                        <tbody>
                          {d.claims.map((c) => (
                            <tr key={c.claim} className="border-b last:border-0">
                              <th className="w-16 px-3 py-2 text-left font-normal text-muted-foreground">{c.claim}</th>
                              <td className="px-3 py-2">
                                <div className="font-mono">{c.iso}</div>
                                <div className="text-muted-foreground">
                                  {new Date(c.seconds * 1000).toLocaleString()} · {relativeTime(c.seconds)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
                <Block title="Signature" text={d.signature || '(none)'} />
                <p className="m-0 text-xs text-muted-foreground">The signature is not verified. Everything here is read from the token itself.</p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
