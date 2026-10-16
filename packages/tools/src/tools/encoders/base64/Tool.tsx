import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { Checkbox, OptionsBar, TextTransform, type TransformMode } from '@/ui';
import { decodeBase64, encodeBase64 } from './logic';

export default function Base64Tool({ initialInput }: ToolProps) {
  const [urlSafe, setUrlSafe] = useState(false);
  // Input handed over (Smart Paste, context menu) that is already Base64 opens in Decode mode.
  const [decodeFirst] = useState(() => !!initialInput && detectText(initialInput).includes('base64'));
  const modes = useMemo(() => {
    const encode: TransformMode = { id: 'encode', label: 'Encode', run: (s) => encodeBase64(s, urlSafe), filename: 'encoded.txt' };
    const decode: TransformMode = { id: 'decode', label: 'Decode', run: decodeBase64, filename: 'decoded.txt' };
    return decodeFirst ? [decode, encode] : [encode, decode];
  }, [urlSafe, decodeFirst]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="URL-safe (- and _, no padding)" checked={urlSafe} onChange={setUrlSafe} />
        </OptionsBar>
      }
    />
  );
}
