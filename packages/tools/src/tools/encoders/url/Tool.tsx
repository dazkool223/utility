import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { OptionsBar, Select, TextTransform, type TransformMode } from '@/ui';
import { decodeUrl, encodeUrl, type UrlScope } from './logic';

export default function UrlEncode({ initialInput }: ToolProps) {
  const [scope, setScope] = useState<UrlScope>('component');
  const [decodeFirst] = useState(() => !!initialInput && detectText(initialInput).includes('url-encoded'));
  const modes = useMemo(() => {
    const encode: TransformMode = { id: 'encode', label: 'Encode', run: (s) => encodeUrl(s, scope), filename: 'encoded.txt' };
    const decode: TransformMode = { id: 'decode', label: 'Decode', run: (s) => decodeUrl(s, scope), filename: 'decoded.txt' };
    return decodeFirst ? [decode, encode] : [encode, decode];
  }, [scope, decodeFirst]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'component', label: 'Component (encodeURIComponent)' },
              { value: 'full', label: 'Full URI (encodeURI)' },
              { value: 'form', label: 'Form data (+ for spaces)' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
