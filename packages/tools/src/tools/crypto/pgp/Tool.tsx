import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { CodeEditor, OptionsBar, PaneTitle, Segmented, Select, TextTransform, useWorker, type TransformMode } from '@/ui';
import { PasswordInput } from '../_lib/PasswordInput';
import type { Curve } from './logic';

type Mode = 'generate' | 'encrypt' | 'decrypt' | 'sign' | 'verify';

const HINTS: Record<Mode, string> = {
  generate: 'Input: a user ID such as "Alice <alice@example.com>".',
  encrypt: 'Input: the message. Use the recipient\'s public key, or leave the key empty and set a passphrase for symmetric encryption.',
  decrypt: 'Input: the armored PGP message. Use your private key (and its passphrase), or just the message passphrase.',
  sign: 'Input: the message. Needs your private key (and its passphrase if it has one).',
  verify: 'Input: the cleartext signed message. Needs the signer\'s public key.',
};

export default function PgpTool({ initialInput }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [mode, setMode] = useState<Mode>('generate');
  const [curve, setCurve] = useState<Curve>('curve25519');
  const [pass, setPass] = useState('');
  const [key, setKey] = useState('');
  const needsKey = mode !== 'generate';

  const tm = useMemo<TransformMode>(() => {
    const filename = mode === 'generate' ? 'pgp-keys.asc' : 'output.asc';
    const run = (s: string): string | Promise<string> => {
      switch (mode) {
        case 'generate': return api().generate(s, curve, pass);
        case 'encrypt': return api().encrypt(s, key, key.trim() ? '' : pass);
        case 'decrypt': return api().decrypt(s, key, pass, key.trim() ? '' : pass);
        case 'sign': return api().sign(s, key, pass);
        case 'verify': return api().verify(s, key);
      }
    };
    return { id: mode, label: mode, run, filename };
  }, [mode, curve, pass, key, api]);

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Operation"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'generate', label: 'Generate key' },
          { value: 'encrypt', label: 'Encrypt' },
          { value: 'decrypt', label: 'Decrypt' },
          { value: 'sign', label: 'Sign' },
          { value: 'verify', label: 'Verify' },
        ]}
      />
      <p className="m-0 text-sm text-muted-foreground">{HINTS[mode]}</p>
      <TextTransform
        key={mode}
        modes={[tm]}
        initialInput={mode === 'generate' ? initialInput : ''}
        options={
          <div className="flex flex-col gap-3">
            <OptionsBar>
              {mode === 'generate' && (
                <Select
                  label="Key type"
                  value={curve}
                  onChange={setCurve}
                  options={[
                    { value: 'curve25519', label: 'Curve25519 (Ed25519 + X25519, fast)' },
                    { value: 'nistP256', label: 'NIST P-256' },
                    { value: 'rsa3072', label: 'RSA 3072 (slow)' },
                  ]}
                />
              )}
              {mode !== 'verify' && <PasswordInput label={mode === 'generate' ? 'Passphrase for the new key (optional)' : 'Passphrase'} value={pass} onChange={setPass} testId="pgp-passphrase" />}
            </OptionsBar>
            {needsKey && (
              <div className="flex flex-col gap-1.5">
                <PaneTitle>{mode === 'encrypt' || mode === 'verify' ? 'Public key' : 'Private key'}</PaneTitle>
                <CodeEditor value={key} onChange={setKey} label="PGP key" testId="pgp-key" placeholder="-----BEGIN PGP ... KEY BLOCK-----" className="!h-40 !min-h-0" />
              </div>
            )}
            <p className="m-0 text-xs text-muted-foreground">
              Licence note: OpenPGP.js is LGPL-3.0 software, shipped here as a separate, unmodified file. Source: github.com/openpgpjs/openpgpjs
            </p>
          </div>
        }
      />
    </div>
  );
}
