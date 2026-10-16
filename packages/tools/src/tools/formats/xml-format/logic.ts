import xmlFormat from 'xml-formatter';
import { assertWellFormed } from '../xml-validate/logic';

export interface XmlFormatOptions {
  indent: '2' | '4' | 'tab';
  collapseContent: boolean;
}

export function formatXml(input: string, { indent, collapseContent }: XmlFormatOptions): string {
  assertWellFormed(input);
  return xmlFormat(input, { indentation: indent === 'tab' ? '\t' : ' '.repeat(Number(indent)), collapseContent, lineSeparator: '\n' });
}
