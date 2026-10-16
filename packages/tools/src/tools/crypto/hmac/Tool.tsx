import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextInput } from '@/ui';
import { formatDigest, inputBytes, type InputFormat, type OutputFormat } from '../hash/logic';
import { DecoderTool } from '../_lib/DecoderTool';
import { hmacAll, keyBytes, type KeyFormat } from './logic';

export default function HmacTool({ initialInput }: ToolProps) {
  const [key, setKey] = useState('Jefe');
  const [keyFmt, setKeyFmt] = useState<KeyFormat>('text');
  const [msgFmt, setMsgFmt] = useState<InputFormat>('text');
  const [outFmt, setOutFmt] = useState<OutputFormat>('hex');
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Message to authenticate…"
      deps={[key, keyFmt, msgFmt, outFmt]}
      options={
        <OptionsBar>
          <TextInput label="Secret key" value={key} onChange={setKey} monospace className="w-64" testId="hmac-key" />
          <Select
            label="Key is"
            value={keyFmt}
            onChange={setKeyFmt}
            options={[
              { value: 'text', label: 'Text' },
              { value: 'hex', label: 'Hex' },
              { value: 'base64', label: 'Base64' },
            ]}
          />
          <Select
            label="Message is"
            value={msgFmt}
            onChange={setMsgFmt}
            options={[
              { value: 'text', label: 'Text' },
              { value: 'hex', label: 'Hex' },
              { value: 'base64', label: 'Base64' },
            ]}
          />
          <Select
            label="Output"
            value={outFmt}
            onChange={setOutFmt}
            options={[
              { value: 'hex', label: 'hex' },
              { value: 'HEX', label: 'HEX' },
              { value: 'base64', label: 'Base64' },
            ]}
          />
        </OptionsBar>
      }
      decode={async (input) => (await hmacAll(keyBytes(key, keyFmt), inputBytes(input, msgFmt))).map(([l, hex]): [string, string] => [l, formatDigest(hex, outFmt)])}
    />
  );
}
