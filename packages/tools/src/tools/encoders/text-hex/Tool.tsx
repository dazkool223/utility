import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { Checkbox, OptionsBar, Select, TextTransform, type TransformMode } from '@/ui';
import { hexdump, hexToText, textToHex, type HexOptions } from './logic';

export default function TextHex({ initialInput }: ToolProps) {
  const [separator, setSeparator] = useState<HexOptions['separator']>('space');
  const [uppercase, setUppercase] = useState(false);
  const [hexFirst] = useState(() => !!initialInput && detectText(initialInput).includes('hex'));
  const modes = useMemo(() => {
    const encode: TransformMode = { id: 'encode', label: 'Text → hex', run: (s) => textToHex(s, { separator, uppercase }), filename: 'hex.txt' };
    const decode: TransformMode = { id: 'decode', label: 'Hex → text', run: hexToText, filename: 'text.txt' };
    const dump: TransformMode = { id: 'dump', label: 'Hexdump', run: hexdump, filename: 'hexdump.txt' };
    return hexFirst ? [decode, encode, dump] : [encode, decode, dump];
  }, [separator, uppercase, hexFirst]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Separator"
            value={separator}
            onChange={setSeparator}
            options={[
              { value: 'space', label: 'Space' },
              { value: 'none', label: 'None' },
              { value: 'colon', label: 'Colon' },
              { value: '0x', label: '0x prefix' },
            ]}
          />
          <Checkbox label="Uppercase" checked={uppercase} onChange={setUppercase} />
        </OptionsBar>
      }
    />
  );
}
