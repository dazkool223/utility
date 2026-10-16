import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { OptionsBar, Select, TextTransform, type TransformMode } from '@/ui';
import { jsonToYaml, yamlToJson } from './logic';

export default function YamlJson({ initialInput }: ToolProps) {
  const [indent, setIndent] = useState('2');
  const [yamlFirst] = useState(() => !!initialInput && !detectText(initialInput).includes('json'));
  const modes = useMemo(() => {
    const n = Number(indent);
    const toYaml: TransformMode = { id: 'to-yaml', label: 'JSON → YAML', run: (s) => jsonToYaml(s, n), inputLanguage: 'json', outputLanguage: 'yaml', filename: 'data.yaml' };
    const toJson: TransformMode = { id: 'to-json', label: 'YAML → JSON', run: (s) => yamlToJson(s, n), inputLanguage: 'yaml', outputLanguage: 'json', filename: 'data.json' };
    return yamlFirst ? [toJson, toYaml] : [toYaml, toJson];
  }, [indent, yamlFirst]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select
            label="Indent"
            value={indent}
            onChange={setIndent}
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
