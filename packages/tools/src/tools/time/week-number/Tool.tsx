import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { weekNumbers } from './logic';

const modes = [{ id: 'week', label: 'Week number', run: (s: string) => weekNumbers(s), filename: 'week-numbers.txt' }];

export default function WeekNumber({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} inputPlaceholder="One date per line: 2024-05-31, 2024-W22, or today" />;
}
