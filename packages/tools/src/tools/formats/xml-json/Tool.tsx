import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { detectText } from '@/core/detect';
import { Checkbox, OptionsBar, TextTransform, type TransformMode } from '@/ui';
import { jsonToXml, xmlToJson } from './logic';

export default function XmlJson({ initialInput }: ToolProps) {
  const [attributes, setAttributes] = useState(true);
  const [types, setTypes] = useState(true);
  const [jsonFirst] = useState(() => !!initialInput && detectText(initialInput).includes('json'));
  const modes = useMemo(() => {
    const toJson: TransformMode = { id: 'to-json', label: 'XML → JSON', run: (s) => xmlToJson(s, { attributes, types }), inputLanguage: 'xml', outputLanguage: 'json', filename: 'data.json' };
    const toXml: TransformMode = { id: 'to-xml', label: 'JSON → XML', run: (s) => jsonToXml(s), inputLanguage: 'json', outputLanguage: 'xml', filename: 'data.xml' };
    return jsonFirst ? [toXml, toJson] : [toJson, toXml];
  }, [attributes, types, jsonFirst]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Checkbox label="Keep attributes (@_name)" checked={attributes} onChange={setAttributes} />
          <Checkbox label="Detect numbers and booleans" checked={types} onChange={setTypes} />
        </OptionsBar>
      }
    />
  );
}
