import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';

export const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript', ext: 'ts' },
  { value: 'go', label: 'Go', ext: 'go' },
  { value: 'rust', label: 'Rust', ext: 'rs' },
  { value: 'java', label: 'Java', ext: 'java' },
  { value: 'kotlin', label: 'Kotlin', ext: 'kt' },
  { value: 'csharp', label: 'C#', ext: 'cs' },
  { value: 'swift', label: 'Swift', ext: 'swift' },
  { value: 'typescript-zod', label: 'Zod (TypeScript)', ext: 'ts' },
  { value: 'python', label: 'Python', ext: 'py' },
] as const;

export type TypeLang = (typeof LANGUAGES)[number]['value'];

const OPTIONS: Partial<Record<TypeLang, Record<string, string>>> = {
  typescript: { 'just-types': 'true' },
  go: { 'just-types': 'true' },
  java: { 'just-types': 'true' },
  swift: { 'just-types': 'true' },
  python: { 'just-types': 'true' },
  csharp: { features: 'attributes-only' },
};

/** Generate type definitions from a JSON sample. quicktype is loaded on demand (it is large). */
export async function jsonToTypes(input: string, lang: TypeLang, rootName: string): Promise<string> {
  parseJson(input);
  const { quicktype, InputData, jsonInputForTargetLanguage } = await import('quicktype-core');
  const jsonInput = jsonInputForTargetLanguage(lang);
  await jsonInput.addSource({ name: rootName.trim() || 'Root', samples: [input] });
  const inputData = new InputData();
  inputData.addInput(jsonInput);
  try {
    const result = await quicktype({ inputData, lang, rendererOptions: OPTIONS[lang] ?? {}, leadingComments: [] });
    return result.lines.join('\n').trim();
  } catch (e) {
    throw new ToolError(`Could not generate types: ${e instanceof Error ? e.message : String(e)}`);
  }
}
