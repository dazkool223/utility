import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { bytesStringToText, textToBytesString, type ByteBase } from './logic';

export default function TextBinary({ initialInput }: ToolProps) {
  const [base, setBase] = useState('2');
  const b = Number(base) as ByteBase;
  const modes = useMemo(
    () => [
      { id: 'encode', label: 'Text → bytes', run: (s: string) => textToBytesString(s, b), filename: 'bytes.txt' },
      { id: 'decode', label: 'Bytes → text', run: (s: string) => bytesStringToText(s, b), filename: 'text.txt' },
    ],
    [b],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Number base"
            value={base}
            onChange={setBase}
            options={[
              { value: '2', label: 'Binary (base 2)' },
              { value: '8', label: 'Octal (base 8)' },
              { value: '10', label: 'Decimal (base 10)' },
              { value: '16', label: 'Hex (base 16)' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
