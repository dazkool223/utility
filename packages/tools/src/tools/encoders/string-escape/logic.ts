import { ToolError } from '@/core/types';

export type EscapeLang = 'js' | 'json' | 'java' | 'csharp' | 'sql' | 'xml' | 'csv';

export const LANGS: ReadonlyArray<{ value: EscapeLang; label: string }> = [
  { value: 'js', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'sql', label: 'SQL (single quotes)' },
  { value: 'xml', label: 'XML / HTML' },
  { value: 'csv', label: 'CSV field' },
];

const hex = (n: number, width: number) => n.toString(16).padStart(width, '0');
const u4 = (unit: number) => '\\u' + hex(unit, 4);

const SIMPLE: Record<string, string> = { '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f' };

function escapeBackslash(input: string, lang: 'js' | 'json' | 'java' | 'csharp', asciiOnly: boolean): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const code = input.charCodeAt(i);
    if (SIMPLE[ch]) out += SIMPLE[ch];
    else if (ch === '"') out += '\\"';
    else if (ch === "'" && lang !== 'json') out += lang === 'java' || lang === 'csharp' || lang === 'js' ? "\\'" : "'";
    else if (ch === '\v' && (lang === 'js' || lang === 'csharp')) out += '\\v';
    else if (code < 0x20 || code === 0x7f) out += lang === 'js' ? '\\x' + hex(code, 2) : u4(code);
    else if (code === 0x2028 || code === 0x2029) out += u4(code);
    else if (asciiOnly && code > 0x7e) out += u4(code);
    else out += ch;
  }
  return out;
}

function unescapeBackslash(input: string, lang: 'js' | 'json' | 'java' | 'csharp'): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = input[++i];
    if (next === undefined) throw new ToolError('The text ends with a lone backslash.');
    switch (next) {
      case 'n': out += '\n'; break;
      case 'r': out += '\r'; break;
      case 't': out += '\t'; break;
      case 'b': out += '\b'; break;
      case 'f': out += '\f'; break;
      case '\\': out += '\\'; break;
      case '"': out += '"'; break;
      case '/': if (lang === 'json') out += '/'; else out += '/'; break;
      case "'":
        if (lang === 'json') throw new ToolError(`JSON does not allow the escape \\' (position ${i}).`);
        out += "'";
        break;
      case 'v':
        if (lang === 'js' || lang === 'csharp') out += '\v';
        else throw new ToolError(`Unknown escape \\v at position ${i}.`);
        break;
      case 'a':
        if (lang === 'csharp') out += '\x07';
        else throw new ToolError(`Unknown escape \\a at position ${i}.`);
        break;
      case 'x': {
        const h = input.slice(i + 1, i + 3);
        if (lang === 'json' || lang === 'java' || !/^[0-9a-fA-F]{2}$/.test(h)) throw new ToolError(`Invalid \\x escape at position ${i}: it needs two hex digits.`);
        out += String.fromCharCode(parseInt(h, 16));
        i += 2;
        break;
      }
      case 'u': {
        if (input[i + 1] === '{' && (lang === 'js' || lang === 'csharp')) {
          const end = input.indexOf('}', i);
          const h = end > 0 ? input.slice(i + 2, end) : '';
          const cp = parseInt(h, 16);
          if (!/^[0-9a-fA-F]{1,6}$/.test(h) || cp > 0x10ffff) throw new ToolError(`Invalid \\u{...} escape at position ${i}.`);
          out += String.fromCodePoint(cp);
          i = end;
        } else {
          const h = input.slice(i + 1, i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(h)) throw new ToolError(`Invalid \\u escape at position ${i}: it needs four hex digits.`);
          out += String.fromCharCode(parseInt(h, 16));
          i += 4;
        }
        break;
      }
      default:
        if (/[0-7]/.test(next) && (lang === 'java' || lang === 'js')) {
          const m = /^[0-7]{1,3}/.exec(input.slice(i))!;
          out += String.fromCharCode(parseInt(m[0], 8));
          i += m[0].length - 1;
        } else if (lang === 'js') out += next;
        else throw new ToolError(`Unknown escape \\${next} at position ${i}.`);
    }
  }
  return out;
}

export function escapeString(input: string, lang: EscapeLang, asciiOnly = false): string {
  switch (lang) {
    case 'sql':
      return input.replace(/'/g, "''");
    case 'xml':
      return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    case 'csv':
      return /[",\r\n]/.test(input) ? '"' + input.replace(/"/g, '""') + '"' : input;
    default:
      return escapeBackslash(input, lang, asciiOnly);
  }
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function unescapeString(input: string, lang: EscapeLang): string {
  switch (lang) {
    case 'sql':
      return input.replace(/''/g, "'");
    case 'xml':
      return input.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(\w+));/g, (all, h: string | undefined, d: string | undefined, n: string | undefined) => {
        if (n) return XML_ENTITIES[n] ?? all;
        const cp = h ? parseInt(h, 16) : parseInt(d!, 10);
        return cp <= 0x10ffff ? String.fromCodePoint(cp) : all;
      });
    case 'csv': {
      const t = input.trim();
      if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/""/g, '"');
      if (t.includes('"') && !t.startsWith('"')) throw new ToolError('A CSV field with quotes inside must be wrapped in quotes.');
      return input;
    }
    default:
      return unescapeBackslash(input, lang);
  }
}
