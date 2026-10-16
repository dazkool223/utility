import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { NumberInput, OptionsBar, Select, TextTransform, type TransformMode } from '@/ui';
import { bytesToBase64Url, randomBytes } from '../_lib/bytes';
import { PasswordInput } from '../_lib/PasswordInput';
import { CIPHERS, DEFAULT_ITERATIONS, MAX_ITERATIONS, decryptText, encryptText, type Cipher } from './logic';

export default function EncryptTool({ initialInput }: ToolProps) {
  // A random passphrase is pre-filled so output appears immediately; replace it with your own.
  const [pass, setPass] = useState(() => bytesToBase64Url(randomBytes(12)));
  const [cipher, setCipher] = useState<Cipher>('AES-GCM');
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const looksEncrypted = !!initialInput && initialInput.trim().startsWith('utl1.');
  const modes = useMemo(() => {
    const enc: TransformMode = { id: 'encrypt', label: 'Encrypt', run: (s) => encryptText(s, pass, { cipher, iterations }), filename: 'encrypted.txt' };
    const dec: TransformMode = { id: 'decrypt', label: 'Decrypt', run: (s) => decryptText(s, pass), filename: 'decrypted.txt' };
    return looksEncrypted ? [dec, enc] : [enc, dec];
  }, [pass, cipher, iterations, looksEncrypted]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <PasswordInput label="Passphrase" value={pass} onChange={setPass} testId="passphrase" />
          <Select label="Cipher (encrypt)" value={cipher} onChange={setCipher} options={CIPHERS.map((c) => ({ value: c, label: c }))} />
          <NumberInput label="PBKDF2 iterations (encrypt)" value={iterations} onChange={setIterations} min={1000} max={MAX_ITERATIONS} step={1000} />
        </OptionsBar>
      }
    />
  );
}
