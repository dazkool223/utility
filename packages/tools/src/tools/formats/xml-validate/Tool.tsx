import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { validateXml } from './logic';

const modes = [{ id: 'validate', label: 'Validate', run: validateXml, inputLanguage: 'xml' as const, outputLanguage: 'text' as const, filename: 'report.txt' }];

export default function XmlValidate({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
