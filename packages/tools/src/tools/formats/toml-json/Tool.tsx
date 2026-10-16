import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { TextTransform, type TransformMode } from '@/ui';
import { jsonToToml, tomlToJson } from './logic';

export default function TomlJson({ initialInput }: ToolProps) {
  const [jsonFirst] = useState(() => !!initialInput && detectText(initialInput).includes('json'));
  const modes = useMemo(() => {
    const toJson: TransformMode = { id: 'to-json', label: 'TOML → JSON', run: (s) => tomlToJson(s), outputLanguage: 'json', filename: 'data.json' };
    const toToml: TransformMode = { id: 'to-toml', label: 'JSON → TOML', run: jsonToToml, inputLanguage: 'json', filename: 'data.toml' };
    return jsonFirst ? [toToml, toJson] : [toJson, toToml];
  }, [jsonFirst]);
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
