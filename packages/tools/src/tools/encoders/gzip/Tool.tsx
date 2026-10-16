import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Checkbox, OptionsBar, Select, TextTransform } from '@/ui';
import { compressToBase64, decompressFromBase64, type CompressFormat } from './logic';

export default function GzipText({ initialInput }: ToolProps) {
  const [format, setFormat] = useState<CompressFormat>('gzip');
  const [urlSafe, setUrlSafe] = useState(false);
  const modes = useMemo(
    () => [
      { id: 'compress', label: 'Compress', run: (s: string) => compressToBase64(s, format, urlSafe), filename: 'compressed.txt' },
      { id: 'decompress', label: 'Decompress', run: (s: string) => decompressFromBase64(s, 'auto'), filename: 'decompressed.txt' },
    ],
    [format, urlSafe],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Compress with"
            value={format}
            onChange={setFormat}
            options={[
              { value: 'gzip', label: 'gzip' },
              { value: 'deflate', label: 'deflate (zlib)' },
              { value: 'deflate-raw', label: 'deflate (raw)' },
            ]}
          />
          <Checkbox label="URL-safe Base64" checked={urlSafe} onChange={setUrlSafe} />
        </OptionsBar>
      }
    />
  );
}
