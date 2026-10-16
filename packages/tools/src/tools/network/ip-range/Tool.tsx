import { useMemo } from 'react';
import type { ToolProps } from '@/core/types';
import { TextTransform, type TransformMode } from '@/ui';
import { convertRanges } from './logic';

export default function IpRangeTool({ initialInput }: ToolProps) {
  const modes = useMemo<TransformMode[]>(
    () => [
      { id: 'range-to-cidr', label: 'Range to CIDR', run: (s) => convertRanges(s, 'range-to-cidr'), filename: 'cidr.txt' },
      { id: 'cidr-to-range', label: 'CIDR to range', run: (s) => convertRanges(s, 'cidr-to-range'), filename: 'ranges.txt' },
      { id: 'merge', label: 'Merge / aggregate', run: (s) => convertRanges(s, 'merge'), filename: 'merged.txt' },
    ],
    [],
  );
  return <TextTransform modes={modes} initialInput={initialInput} inputPlaceholder={'10.0.0.1 - 10.0.0.6\n192.168.0.0/24\n2001:db8::/32'} />;
}
