import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { validateJson } from './logic';

const modes = [{ id: 'validate', label: 'Validate', run: validateJson, inputLanguage: 'json' as const, outputLanguage: 'text' as const, filename: 'report.txt' }];

export default function JsonValidate({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
