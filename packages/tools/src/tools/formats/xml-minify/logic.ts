import xmlFormat from 'xml-formatter';
import { assertWellFormed } from '../xml-validate/logic';

export function minifyXml(input: string, stripComments: boolean): string {
  assertWellFormed(input);
  return xmlFormat(input, {
    indentation: '',
    lineSeparator: '',
    collapseContent: true,
    filter: stripComments ? (node) => node.type !== 'Comment' : undefined,
  });
}
