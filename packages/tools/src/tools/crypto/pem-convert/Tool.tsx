import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Segmented, Select, TextTransform } from '@/ui';
import { PEM_LABELS, derToPem, jwkToPem, pemToDer } from './logic';

type Mode = 'pem' | 'der' | 'jwk';

export default function PemConvertTool({ initialInput }: ToolProps) {
  const [mode, setMode] = useState<Mode>(initialInput && /^\s*\{/.test(initialInput) ? 'jwk' : 'pem');
  const [label, setLabel] = useState<string>('PUBLIC KEY');
  const tm = useMemo(
    () => ({
      pem: { id: 'pem', label: 'PEM to DER + JWK', run: pemToDer, inputLanguage: 'text' as const, filename: 'converted.txt' },
      der: { id: 'der', label: 'DER to PEM', run: (s: string) => derToPem(s, label), inputLanguage: 'text' as const, filename: 'converted.pem' },
      jwk: { id: 'jwk', label: 'JWK to PEM', run: jwkToPem, inputLanguage: 'json' as const, filename: 'converted.pem' },
    }),
    [label],
  );
  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Conversion"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'pem', label: 'PEM to DER + JWK' },
          { value: 'der', label: 'DER to PEM' },
          { value: 'jwk', label: 'JWK to PEM' },
        ]}
      />
      <TextTransform
        key={mode}
        modes={[tm[mode]]}
        initialInput={mode === 'pem' ? initialInput : ''}
        options={
          mode === 'der' ? (
            <OptionsBar>
              <Select label="PEM label" value={label} onChange={setLabel} options={PEM_LABELS.map((l) => ({ value: l, label: l }))} />
            </OptionsBar>
          ) : undefined
        }
      />
    </div>
  );
}
