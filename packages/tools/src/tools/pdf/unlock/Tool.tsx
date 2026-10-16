import { useState } from 'react';
import { transfer } from 'comlink';
import { formatBytes } from '@/core/limits';
import type { ToolProps } from '@/core/types';
import { Button, ErrorBox, FileDrop, FileList, OptionsBar, useRunShortcut, useWorker } from '@/ui';
import { isPdfFile, plural, stripExtension } from '../_lib/files';
import { BusyLine, FileResult, PasswordField, readFile, useTask } from '../_lib/ui';

export default function UnlockTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.find(isPdfFile) ?? null);
  const [password, setPassword] = useState('');
  const task = useTask<{ blob: Blob; name: string; summary: string }>();

  const unlock = () =>
    task.run(async () => {
      const buf = await readFile(file!);
      const out = await api().unlock(transfer(buf, [buf]), password);
      const blob = new Blob([out.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const name = `${stripExtension(file!.name)}-unlocked.pdf`;
      const state = out.wasEncrypted ? 'password and limits removed' : 'this PDF had no password, so it was only re-saved';
      return { blob, name, summary: `${name}: ${plural(out.pageCount, 'page')}, ${state}, ${formatBytes(blob.size)}` };
    });
  useRunShortcut(() => {
    if (file && !task.busy) void unlock();
  });

  return (
    <div className="flex flex-col gap-3">
      <FileDrop
        kind="pdf"
        accept="application/pdf,.pdf"
        onFiles={(f) => {
          setFile(f.find(isPdfFile) ?? null);
          task.reset();
        }}
        label="Drop a locked PDF"
      />
      {file && <FileList files={[file]} />}
      <OptionsBar>
        <PasswordField label="Password (blank if it only restricts printing or copying)" value={password} onChange={setPassword} testId="password" />
        <Button variant="primary" onClick={() => void unlock()} disabled={!file || task.busy} testId="run">
          Unlock PDF
        </Button>
      </OptionsBar>
      <BusyLine busy={task.busy} label="Unlocking…" />
      <ErrorBox error={task.error} />
      {task.result && <FileResult blob={task.result.blob} filename={task.result.name} summary={task.result.summary} />}
    </div>
  );
}
