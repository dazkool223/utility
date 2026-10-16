import { useEffect, useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { ErrorBox, FileDrop, FileList, KeyValueTable, PaneTitle, useWorker } from '@/ui';
import { isPdfFile, plural } from '../_lib/files';
import { BusyLine, readFile, useTask } from '../_lib/ui';
import type { SignatureReport, ValidationResult, Verdict } from './logic';

const VERDICT: Record<Verdict, { label: string; className: string }> = {
  valid: { label: 'Intact', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  'valid-extended': { label: 'Intact, file extended later', className: 'bg-warning text-warning-foreground' },
  invalid: { label: 'Not valid', className: 'bg-destructive/10 text-destructive' },
  unsupported: { label: 'Could not be checked', className: 'bg-muted text-muted-foreground' },
};

const yesNo = (v: boolean | null) => (v === null ? 'Not checked' : v ? 'Yes' : 'No');

function rows(s: SignatureReport): Array<[string, string]> {
  const r: Array<[string, string]> = [
    ['Signed content unchanged', yesNo(s.digestMatches)],
    ['Signature matches certificate', yesNo(s.signatureVerifies)],
    ['Covers the whole file', s.coversWholeFile ? 'Yes' : 'No: bytes were added after signing'],
  ];
  if (s.signer) r.push(['Signer', s.signer]);
  if (s.name) r.push(['Name in signature', s.name]);
  if (s.signingTime) r.push(['Signing time (in signature)', s.signingTime]);
  if (s.claimedDate) r.push(['Date claimed by the file', s.claimedDate]);
  if (s.reason) r.push(['Reason', s.reason]);
  if (s.location) r.push(['Location', s.location]);
  if (s.contactInfo) r.push(['Contact', s.contactInfo]);
  const c = s.signerCertificate;
  if (c) {
    r.push(['Certificate subject', c.subject], ['Certificate issuer', c.issuer], ['Valid', `${c.notBefore} to ${c.notAfter}`], ['Serial number', c.serialNumber], ['Key', c.keyAlgorithm]);
    r.push(['Self-signed', c.selfSigned ? 'Yes' : 'No'], ['Valid when signed', yesNo(s.certificateValidAtSigning)]);
  }
  if (s.digestAlgorithm) r.push(['Digest algorithm', s.digestAlgorithm]);
  if (s.subFilter) r.push(['Signature type', s.subFilter]);
  return r;
}

export default function ValidateSignatureTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(null);
  const task = useTask<ValidationResult>();

  const check = (f: File) => {
    setFile(f);
    void task.run(async () => {
      const buf = await readFile(f);
      return (await api().validate(transfer(buf, [buf]))) as ValidationResult;
    });
  };
  useEffect(() => {
    const initial = initialFiles?.find(isPdfFile);
    if (initial) check(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for files handed over on open
  }, []);

  const result = task.result;
  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => { const p = f.find(isPdfFile); if (p) check(p); }} label="Drop a signed PDF" />
      {file && <FileList files={[file]} />}
      <BusyLine busy={task.busy} label="Checking signatures…" />
      <ErrorBox error={task.error} />
      {result && (
        <div className="flex flex-col gap-4" data-testid="tool-output">
          <p className="m-0 text-sm" data-testid="result-summary">
            {result.signatures.length === 0 ? 'This PDF has no digital signatures.' : `${plural(result.signatures.length, 'signature')} found in ${formatBytes(result.fileSize)}.`}
          </p>
          {result.signatures.map((s) => (
            <section key={s.index} className="flex flex-col gap-2" data-testid="signature">
              <div className="flex flex-wrap items-center gap-2">
                <PaneTitle>Signature {s.index}</PaneTitle>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${VERDICT[s.verdict].className}`} data-testid="verdict" data-verdict={s.verdict}>
                  {VERDICT[s.verdict].label}
                </span>
                {s.isTimestamp && <span className="text-xs text-muted-foreground">Document timestamp</span>}
              </div>
              <p className="m-0 text-sm">{s.summary}</p>
              <KeyValueTable testId={`signature-${s.index}`} rows={rows(s)} />
              {s.notes.length > 0 && (
                <ul className="m-0 list-disc pl-5 text-sm text-muted-foreground">
                  {s.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
