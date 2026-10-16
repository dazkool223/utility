import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { decodeEntities, encodeEntities, type EntityStyle } from './logic';

export default function HtmlEntities({ initialInput }: ToolProps) {
  const [style, setStyle] = useState<EntityStyle>('minimal');
  const modes = useMemo(
    () => [
      { id: 'encode', label: 'Encode', run: (s: string) => encodeEntities(s, style), filename: 'encoded.txt' },
      { id: 'decode', label: 'Decode', run: decodeEntities, filename: 'decoded.txt' },
    ],
    [style],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Encode style"
            value={style}
            onChange={setStyle}
            options={[
              { value: 'minimal', label: 'Minimal (& < > quotes)' },
              { value: 'named', label: 'Named (&eacute;)' },
              { value: 'hex', label: 'Hex (&#xE9;)' },
              { value: 'decimal', label: 'Decimal (&#233;)' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
