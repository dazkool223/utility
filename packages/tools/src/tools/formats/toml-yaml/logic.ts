import { stringify } from 'yaml';
import { parseYaml } from '../yaml-json/logic';
import { parseToml, stringifyToml } from '../toml-json/logic';

export function tomlToYaml(input: string): string {
  return stringify(JSON.parse(JSON.stringify(parseToml(input))), { lineWidth: 0 }).trimEnd();
}

export function yamlToToml(input: string): string {
  return stringifyToml(parseYaml(input));
}
