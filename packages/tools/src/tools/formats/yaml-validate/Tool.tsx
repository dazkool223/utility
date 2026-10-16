import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { validateYaml } from './logic';

const modes = [{ id: 'validate', label: 'Validate', run: validateYaml, inputLanguage: 'yaml' as const, outputLanguage: 'text' as const, filename: 'report.txt' }];

export default function YamlValidate({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
