import type { ToolProps } from '@/core/types';
import { TextTransform } from '@/ui';
import { minifyJson } from './logic';

const modes = [{ id: 'minify', label: 'Minify', run: minifyJson, inputLanguage: 'json' as const, filename: 'minified.json' }];

export default function JsonMinify({ initialInput }: ToolProps) {
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
