import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { TextTransform, type TransformMode } from '@/ui';
import { tomlToYaml, yamlToToml } from './logic';

export default function TomlYaml({ initialInput }: ToolProps) {
  const [yamlFirst] = useState(() => !!initialInput && detectText(initialInput).includes('yaml'));
  const modes = useMemo(() => {
    const toYaml: TransformMode = { id: 'to-yaml', label: 'TOML → YAML', run: tomlToYaml, outputLanguage: 'yaml', filename: 'data.yaml' };
    const toToml: TransformMode = { id: 'to-toml', label: 'YAML → TOML', run: yamlToToml, inputLanguage: 'yaml', filename: 'data.toml' };
    return yamlFirst ? [toToml, toYaml] : [toYaml, toToml];
  }, [yamlFirst]);
  return <TextTransform modes={modes} initialInput={initialInput} />;
}
