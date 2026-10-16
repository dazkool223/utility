import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { describeChmod } from './logic';

const modes = [{ id: 'chmod', label: 'Explain', run: (s: string) => describeChmod(s), filename: 'permissions.txt' }];

export default function ChmodCalc({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} inputPlaceholder="755, rwxr-xr-x, -rw-r--r--, or u=rwx,g=rx,o=rx" />;
}
