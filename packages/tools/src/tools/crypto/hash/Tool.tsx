import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select } from '@/ui';
import { DecoderTool } from '../_lib/DecoderTool';
import { formatDigest, hashAll, inputBytes, type InputFormat, type OutputFormat } from './logic';

export default function HashTool({ initialInput }: ToolProps) {
  const [inFmt, setInFmt] = useState<InputFormat>('text');
  const [outFmt, setOutFmt] = useState<OutputFormat>('hex');
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Type or paste the text to hash…"
      deps={[inFmt, outFmt]}
      options={
        <OptionsBar>
          <Select
            label="Input is"
            value={inFmt}
            onChange={setInFmt}
            options={[
              { value: 'text', label: 'Text (UTF-8)' },
              { value: 'hex', label: 'Hex bytes' },
              { value: 'base64', label: 'Base64 bytes' },
            ]}
          />
          <Select
            label="Output"
            value={outFmt}
            onChange={setOutFmt}
            options={[
              { value: 'hex', label: 'hex (lowercase)' },
              { value: 'HEX', label: 'HEX (uppercase)' },
              { value: 'base64', label: 'Base64' },
            ]}
          />
        </OptionsBar>
      }
      decode={async (input) => (await hashAll(inputBytes(input, inFmt))).map((r): [string, string] => [r.label, formatDigest(r.hex, outFmt)])}
    />
  );
}
