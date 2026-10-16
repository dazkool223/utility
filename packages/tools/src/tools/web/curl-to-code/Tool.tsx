import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Segmented, TextTransform } from '@/ui';
import { curlToCode, type CurlTarget } from './logic';

const EXT: Record<CurlTarget, string> = { javascript: 'request.js', python: 'request.py', shell: 'request.sh' };

export default function CurlToCode({ initialInput }: ToolProps) {
  const [target, setTarget] = useState<CurlTarget>('javascript');
  const modes = useMemo(
    () => [{ id: 'convert', label: 'Convert', run: (s: string) => curlToCode(s, target), outputLanguage: target === 'javascript' ? ('javascript' as const) : ('text' as const), filename: EXT[target] }],
    [target],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      inputPlaceholder="curl https://api.example.com -H 'Accept: application/json'"
      options={
        <OptionsBar>
          <Segmented
            label="Language"
            value={target}
            onChange={setTarget}
            options={[
              { value: 'javascript', label: 'JavaScript' },
              { value: 'python', label: 'Python' },
              { value: 'shell', label: 'Shell' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
