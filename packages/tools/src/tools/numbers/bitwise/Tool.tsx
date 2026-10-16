import { useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select } from '@/ui';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { evaluateBitwise, type Width } from './logic';

export default function BitwiseTool({ initialInput }: ToolProps) {
  const [width, setWidth] = useState<'8' | '16' | '32' | '64'>('32');
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="0xFF & 0x0F    1 << 4    ~0    (a | b) ^ c    rol(0x81, 1)"
      deps={[width]}
      options={
        <OptionsBar>
          <Select label="Word size" value={width} onChange={setWidth} options={[{ value: '8', label: '8-bit' }, { value: '16', label: '16-bit' }, { value: '32', label: '32-bit' }, { value: '64', label: '64-bit' }]} />
          <p className="m-0 pb-1.5 text-xs text-muted-foreground">Operators: & | ^ ~ &lt;&lt; &gt;&gt; &gt;&gt;&gt; + - * / % ( ) rol() ror(). Numbers: 255, 0xFF, 0b1010, 0o17.</p>
        </OptionsBar>
      }
      decode={(s) => {
        const r = evaluateBitwise(s, Number(width) as Width);
        return [
          ['Hex', r.hex],
          ['Decimal (unsigned)', r.unsigned.toString()],
          ['Decimal (signed)', r.signed.toString()],
          ['Binary', r.binary],
          ['Octal', r.octal],
          ['Bits set', String(r.popcount)],
          ['Set bit positions', r.setBits.length ? r.setBits.join(', ') : 'none'],
          ['Leading zeros', String(r.leadingZeros)],
          ['Trailing zeros', String(r.trailingZeros)],
          ['Byte-swapped', r.byteSwapped],
        ];
      }}
    />
  );
}
