import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextInput, TextTransform } from '@/ui';
import { jsonToTypes, LANGUAGES, type TypeLang } from './logic';

export default function JsonTypes({ initialInput }: ToolProps) {
  const [lang, setLang] = useState<TypeLang>('typescript');
  const [name, setName] = useState('Root');
  const modes = useMemo(
    () => [
      {
        id: 'types',
        label: 'Generate',
        run: (s: string) => jsonToTypes(s, lang, name),
        inputLanguage: 'json' as const,
        outputLanguage: lang === 'typescript' || lang === 'typescript-zod' ? ('typescript' as const) : ('text' as const),
        filename: `types.${LANGUAGES.find((l) => l.value === lang)?.ext ?? 'txt'}`,
      },
    ],
    [lang, name],
  );
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      options={
        <OptionsBar>
          <Select label="Language" value={lang} onChange={setLang} options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))} />
          <TextInput label="Root type name" value={name} onChange={setName} monospace />
        </OptionsBar>
      }
    />
  );
}
