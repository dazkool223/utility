import { useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, Checkbox, ErrorBox, FileDrop, FileList, OptionsBar, useRunShortcut, useWorker } from '@/ui';
import { isPdfFile, plural, stripExtension } from '../_lib/files';
import { BusyLine, FileResult, PasswordField, readFile, useTask } from '../_lib/ui';

export default function ProtectTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [owner, setOwner] = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowEditing, setAllowEditing] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const task = useTask<{ blob: Blob; name: string; summary: string }>();

  const protect = () => {
    if (!file) return;
    if (!password) return setFormError('Enter a password to protect the PDF with.');
    if (password !== confirm) return setFormError('The two passwords do not match.');
    setFormError(null);
    void task.run(async () => {
      const buf = await readFile(file);
      const out = await api().protect(transfer(buf, [buf]), { password, ownerPassword: owner, allowPrinting, allowCopying, allowEditing });
      const blob = new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const name = `${stripExtension(file.name)}-protected.pdf`;
      return { blob, name, summary: `${name}: ${plural(out.pageCount, 'page')}, AES-256 encrypted, ${formatBytes(blob.size)}` };
    });
  };
  useRunShortcut(() => {
    if (file && !task.busy) protect();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="pdf" accept="application/pdf,.pdf" onFiles={(f) => { setFile(f.find(isPdfFile) ?? null); task.reset(); }} label="Drop a PDF to password-protect" />
      {file && <FileList files={[file]} />}
      <OptionsBar>
        <PasswordField label="Password to open the PDF" value={password} onChange={setPassword} testId="password" />
        <PasswordField label="Repeat password" value={confirm} onChange={setConfirm} testId="password-confirm" />
        <PasswordField label="Owner password (optional)" value={owner} onChange={setOwner} testId="owner-password" />
      </OptionsBar>
      <OptionsBar>
        <Checkbox label="Allow printing" checked={allowPrinting} onChange={setAllowPrinting} />
        <Checkbox label="Allow copying text" checked={allowCopying} onChange={setAllowCopying} />
        <Checkbox label="Allow editing and annotating" checked={allowEditing} onChange={setAllowEditing} />
        <Button variant="primary" onClick={protect} disabled={!file || task.busy} testId="run">
          Protect PDF
        </Button>
      </OptionsBar>
      <p className="m-0 text-xs text-muted-foreground">Without an owner password, a random one is used and discarded, so the limits above cannot be lifted later.</p>
      <BusyLine busy={task.busy} label="Encrypting…" />
      <ErrorBox error={formError ?? task.error} />
      {task.result && <FileResult blob={task.result.blob} filename={task.result.name} summary={task.result.summary} />}
    </div>
  );
}
