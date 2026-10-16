import { useCallback, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { GeneratorTool, OptionsBar, Segmented, Select, TextInput, useWorker } from '@/ui';
import { DecoderTool } from '../_lib/DecoderTool';
import { inspectPublicKey, type SshKeyOptions } from './logic';

function Generate() {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [type, setType] = useState<SshKeyOptions['type']>('ed25519');
  const [bits, setBits] = useState<'2048' | '3072' | '4096'>('3072');
  const [comment, setComment] = useState('me@example');
  const generate = useCallback(() => api().generate({ type, bits: Number(bits) as SshKeyOptions['bits'], comment }), [api, type, bits, comment]);
  return (
    <GeneratorTool
      generate={generate}
      filename="ssh-key.txt"
      options={
        <OptionsBar>
          <Select label="Type" value={type} onChange={setType} options={[{ value: 'ed25519', label: 'Ed25519 (recommended)' }, { value: 'rsa', label: 'RSA' }]} />
          {type === 'rsa' && <Select label="RSA size" value={bits} onChange={setBits} options={[{ value: '2048', label: '2048' }, { value: '3072', label: '3072' }, { value: '4096', label: '4096 (slow)' }]} />}
          <TextInput label="Comment" value={comment} onChange={setComment} className="w-48" />
        </OptionsBar>
      }
    />
  );
}

export default function SshKeyTool({ initialInput }: ToolProps) {
  const [mode, setMode] = useState<'fingerprint' | 'generate'>('fingerprint');
  return (
    <div className="flex flex-col gap-3">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'fingerprint', label: 'Fingerprint' }, { value: 'generate', label: 'Generate' }]} />
      {mode === 'generate' ? (
        <Generate />
      ) : (
        <DecoderTool
          initialInput={initialInput}
          placeholder="Paste a public key: ssh-ed25519 AAAA… user@host"
          decode={async (s) => {
            const k = await inspectPublicKey(s);
            return [
              ['Type', k.type],
              ['Size', k.bits ? `${k.bits} bits` : 'n/a'],
              ['SHA-256 fingerprint', k.sha256],
              ['MD5 fingerprint (legacy)', k.md5],
              ['Comment', k.comment || '(none)'],
            ];
          }}
        />
      )}
    </div>
  );
}
