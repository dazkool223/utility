import { useCallback, useState } from 'react';
import { GeneratorTool, OptionsBar, Select, useWorker } from '@/ui';
import type { KeyFormat, RsaOptions, RsaUse } from './logic';

export default function RsaTool() {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [bits, setBits] = useState<'2048' | '3072' | '4096'>('2048');
  const [use, setUse] = useState<RsaUse>('rsa-oaep');
  const [hash, setHash] = useState<RsaOptions['hash']>('SHA-256');
  const [format, setFormat] = useState<KeyFormat>('pem');
  const generate = useCallback(() => api().generate({ bits: Number(bits) as RsaOptions['bits'], use, hash }, format), [bits, use, hash, format, api]);
  return (
    <GeneratorTool
      generate={generate}
      filename={format === 'pem' ? 'rsa-keys.pem' : 'rsa-keys.json'}
      options={
        <OptionsBar>
          <Select
            label="Key size"
            value={bits}
            onChange={setBits}
            options={[
              { value: '2048', label: '2048 bits' },
              { value: '3072', label: '3072 bits' },
              { value: '4096', label: '4096 bits (slow)' },
            ]}
          />
          <Select
            label="Intended use"
            value={use}
            onChange={setUse}
            options={[
              { value: 'rsa-oaep', label: 'Encryption (RSA-OAEP)' },
              { value: 'rsa-pss', label: 'Signing (RSA-PSS)' },
              { value: 'rsa-pkcs1', label: 'Signing (PKCS#1 v1.5)' },
            ]}
          />
          <Select
            label="Hash (JWK alg)"
            value={hash}
            onChange={setHash}
            options={[
              { value: 'SHA-256', label: 'SHA-256' },
              { value: 'SHA-384', label: 'SHA-384' },
              { value: 'SHA-512', label: 'SHA-512' },
            ]}
          />
          <Select
            label="Format"
            value={format}
            onChange={setFormat}
            options={[
              { value: 'pem', label: 'PEM (PKCS#8 + SPKI)' },
              { value: 'jwk', label: 'JWK' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
