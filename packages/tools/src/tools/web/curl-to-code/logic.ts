import { ToolError } from '@/core/types';

export type CurlTarget = 'javascript' | 'shell' | 'python';

export interface CurlRequest {
  url: string;
  method: string;
  headers: Array<[string, string]>;
  body?: string;
  form?: Array<[string, string]>;
  basicAuth?: [string, string];
  insecure: boolean;
  /** Options we recognised but cannot express in code; reported to the user. */
  ignored: string[];
}

/** Split a shell command line into words, honouring '…', "…", $'…', backslashes and line continuations. */
export function tokenize(src: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let inWord = false;
  let i = 0;
  const push = () => {
    if (inWord) tokens.push(cur);
    cur = '';
    inWord = false;
  };
  while (i < src.length) {
    const c = src[i]!;
    if (c === '\\' && (src[i + 1] === '\n' || (src[i + 1] === '\r' && src[i + 2] === '\n'))) {
      i += src[i + 1] === '\r' ? 3 : 2;
      continue;
    }
    if (/\s/.test(c)) {
      push();
      i++;
      continue;
    }
    if (c === '\\') {
      inWord = true;
      cur += src[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new ToolError("The command has a single quote (') that is never closed.");
      inWord = true;
      cur += src.slice(i + 1, end);
      i = end + 1;
      continue;
    }
    if (c === '$' && src[i + 1] === "'") {
      inWord = true;
      i += 2;
      let closed = false;
      while (i < src.length) {
        const d = src[i]!;
        if (d === "'") {
          closed = true;
          i++;
          break;
        }
        if (d === '\\') {
          const n = src[i + 1] ?? '';
          const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', e: '\x1b' };
          if (n in simple) {
            cur += simple[n];
            i += 2;
            continue;
          }
          const hex = /^x([0-9a-fA-F]{1,2})/.exec(src.slice(i + 1));
          if (hex) {
            cur += String.fromCharCode(parseInt(hex[1]!, 16));
            i += 1 + hex[0].length;
            continue;
          }
          const uni = /^u([0-9a-fA-F]{4})/.exec(src.slice(i + 1));
          if (uni) {
            cur += String.fromCharCode(parseInt(uni[1]!, 16));
            i += 1 + uni[0].length;
            continue;
          }
          cur += n;
          i += 2;
          continue;
        }
        cur += d;
        i++;
      }
      if (!closed) throw new ToolError("The command has a $'…' string that is never closed.");
      continue;
    }
    if (c === '"') {
      inWord = true;
      i++;
      let closed = false;
      while (i < src.length) {
        const d = src[i]!;
        if (d === '"') {
          closed = true;
          i++;
          break;
        }
        if (d === '\\' && '"\\$`\n'.includes(src[i + 1] ?? 'x')) {
          if (src[i + 1] !== '\n') cur += src[i + 1];
          i += 2;
          continue;
        }
        cur += d;
        i++;
      }
      if (!closed) throw new ToolError('The command has a double quote (") that is never closed.');
      continue;
    }
    inWord = true;
    cur += c;
    i++;
  }
  push();
  return tokens;
}

// Options that take a value. Short flags are listed without the dash.
const SHORT_WITH_VALUE = new Set(['X', 'H', 'd', 'u', 'A', 'e', 'b', 'F', 'o', 'm', 'x', 'w', 'T', 'K', 'c', 'D', 'E', 'y', 'Y', 'z', 'C', 'r', 'Q', 't']);
const LONG_WITH_VALUE = new Set([
  'request', 'header', 'data', 'data-raw', 'data-binary', 'data-ascii', 'data-urlencode', 'user', 'user-agent', 'referer', 'cookie', 'form', 'form-string',
  'output', 'max-time', 'connect-timeout', 'proxy', 'write-out', 'upload-file', 'config', 'cookie-jar', 'dump-header', 'cert', 'key', 'cacert', 'resolve',
  'retry', 'retry-delay', 'limit-rate', 'url', 'json', 'oauth2-bearer', 'range', 'proxy-user', 'interface', 'connect-to', 'max-redirs', 'compressed-ssh',
  'aws-sigv4', 'cert-type', 'capath', 'ciphers', 'expect100-timeout', 'keepalive-time', 'local-port', 'max-filesize', 'noproxy', 'pinnedpubkey', 'time-cond',
]);

function utf8Base64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function parseCurl(command: string): CurlRequest {
  let src = command.trim();
  if (!src) throw new ToolError('Paste a curl command, for example: curl https://example.com -H "Accept: application/json".');
  src = src.replace(/^\s*\$\s+/, '');
  const tokens = tokenize(src);
  const first = tokens.shift();
  if (first !== 'curl') throw new ToolError('The command must start with curl.');

  let url: string | undefined;
  let method: string | undefined;
  const headers: Array<[string, string]> = [];
  const dataParts: string[] = [];
  const form: Array<[string, string]> = [];
  let basicAuth: [string, string] | undefined;
  let head = false;
  let getMode = false;
  let insecure = false;
  let jsonFlag = false;
  const ignored: string[] = [];

  const addHeader = (raw: string) => {
    const idx = raw.indexOf(':');
    if (idx < 0) {
      if (raw.endsWith(';')) headers.push([raw.slice(0, -1).trim(), '']);
      return;
    }
    const name = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (!name) throw new ToolError(`The header "${raw}" has no name.`);
    if (!value) return; // "Name:" removes a header in curl
    headers.push([name, value]);
  };

  const dataValue = (kind: string, v: string): string => {
    if (kind === 'data-urlencode') {
      const eq = v.indexOf('=');
      if (eq < 0) return encodeURIComponent(v);
      const name = v.slice(0, eq);
      return (name ? name + '=' : '') + encodeURIComponent(v.slice(eq + 1));
    }
    if (kind !== 'data-raw' && v.startsWith('@')) {
      throw new ToolError(`The data option reads from the file "${v.slice(1)}", which this Tool cannot open. Paste the file contents into the command instead.`);
    }
    return v;
  };

  const apply = (name: string, value: string | undefined) => {
    switch (name) {
      case 'X':
      case 'request':
        method = value!.toUpperCase();
        break;
      case 'H':
      case 'header':
        addHeader(value!);
        break;
      case 'd':
      case 'data':
      case 'data-raw':
      case 'data-binary':
      case 'data-ascii':
      case 'data-urlencode':
        dataParts.push(dataValue(name === 'd' ? 'data' : name, value!));
        break;
      case 'json':
        jsonFlag = true;
        dataParts.push(dataValue('data-raw', value!));
        break;
      case 'u':
      case 'user': {
        const c = value!.indexOf(':');
        basicAuth = c < 0 ? [value!, ''] : [value!.slice(0, c), value!.slice(c + 1)];
        break;
      }
      case 'A':
      case 'user-agent':
        headers.push(['User-Agent', value!]);
        break;
      case 'e':
      case 'referer':
        headers.push(['Referer', value!]);
        break;
      case 'b':
      case 'cookie':
        if (value!.includes('=')) headers.push(['Cookie', value!]);
        else ignored.push(`--cookie ${value}`);
        break;
      case 'F':
      case 'form':
      case 'form-string': {
        const eq = value!.indexOf('=');
        if (eq < 0) throw new ToolError(`The form field "${value}" must look like name=value.`);
        const v = value!.slice(eq + 1);
        if (name !== 'form-string' && (v.startsWith('@') || v.startsWith('<'))) {
          throw new ToolError(`The form field "${value!.slice(0, eq)}" uploads the file "${v.slice(1)}", which this Tool cannot read. Build that part by hand.`);
        }
        form.push([value!.slice(0, eq), v]);
        break;
      }
      case 'url':
        url = value;
        break;
      case 'I':
      case 'head':
        head = true;
        break;
      case 'G':
      case 'get':
        getMode = true;
        break;
      case 'k':
      case 'insecure':
        insecure = true;
        break;
      case 'compressed':
      case 's':
      case 'S':
      case 'silent':
      case 'show-error':
      case 'L':
      case 'location':
      case 'v':
      case 'verbose':
      case 'i':
      case 'include':
      case 'f':
      case 'fail':
      case 'O':
      case 'o':
      case 'output':
      case 'globoff':
      case 'g':
      case 'http1.1':
      case 'http2':
      case 'tr-encoding':
      case 'D':
      case 'dump-header':
      case 'progress-bar':
      case '#':
        break;
      default:
        ignored.push(value === undefined ? (name.length === 1 ? `-${name}` : `--${name}`) : `${name.length === 1 ? '-' : '--'}${name} ${value}`);
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === '|' || t === '||' || t === '&&' || t === ';') break;
    if (t.startsWith('--') && t.length > 2) {
      let name = t.slice(2);
      let value: string | undefined;
      const eq = name.indexOf('=');
      if (eq > 0) {
        value = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      if (LONG_WITH_VALUE.has(name) && value === undefined) {
        value = tokens[++i];
        if (value === undefined) throw new ToolError(`The option --${name} needs a value.`);
      }
      apply(name, LONG_WITH_VALUE.has(name) ? value : undefined);
    } else if (t.startsWith('-') && t.length > 1) {
      for (let j = 1; j < t.length; j++) {
        const ch = t[j]!;
        if (SHORT_WITH_VALUE.has(ch)) {
          let value = t.slice(j + 1);
          if (!value) {
            const next = tokens[++i];
            if (next === undefined) throw new ToolError(`The option -${ch} needs a value.`);
            value = next;
          }
          apply(ch, value);
          break;
        }
        apply(ch, undefined);
      }
    } else if (url === undefined) {
      url = t;
    } else {
      throw new ToolError(`Found a second URL ("${t}"). This Tool converts one request at a time.`);
    }
  }

  if (!url) throw new ToolError('No URL found in the curl command.');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:|\/|$)/.test(url) ? 'http://' : 'https://') + url;

  let body = dataParts.length ? dataParts.join('&') : undefined;
  if (getMode && body !== undefined) {
    url += (url.includes('?') ? '&' : '?') + body;
    body = undefined;
  }
  if (body !== undefined && form.length) throw new ToolError('The command mixes -d (data) and -F (form) options, which curl does not allow.');
  const hasType = headers.some(([k]) => k.toLowerCase() === 'content-type');
  if (jsonFlag) {
    if (!hasType) headers.push(['Content-Type', 'application/json']);
    if (!headers.some(([k]) => k.toLowerCase() === 'accept')) headers.push(['Accept', 'application/json']);
  } else if (body !== undefined && !hasType) headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
  const finalMethod = method ?? (head ? 'HEAD' : body !== undefined || form.length ? 'POST' : 'GET');
  const req: CurlRequest = { url, method: finalMethod, headers, insecure, ignored };
  if (body !== undefined) req.body = body;
  if (form.length) req.form = form;
  if (basicAuth) req.basicAuth = basicAuth;
  return req;
}

/** Last value wins for repeated header names (case-insensitive). */
function dedupe(headers: Array<[string, string]>): Array<[string, string]> {
  const map = new Map<string, [string, string]>();
  for (const [k, v] of headers) map.set(k.toLowerCase(), [k, v]);
  return [...map.values()];
}

function isJsonType(headers: Array<[string, string]>): boolean {
  return headers.some(([k, v]) => k.toLowerCase() === 'content-type' && /json/i.test(v));
}

function tryJson(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false };
  }
}

function withAuthHeader(req: CurlRequest): Array<[string, string]> {
  const h = [...req.headers];
  if (req.basicAuth && !h.some(([k]) => k.toLowerCase() === 'authorization')) h.push(['Authorization', 'Basic ' + utf8Base64(req.basicAuth.join(':'))]);
  return dedupe(h);
}

const js = (s: string) => JSON.stringify(s);

function indentJson(value: unknown, pad: string): string {
  return JSON.stringify(value, null, 2).replace(/\n/g, '\n' + pad);
}

export function toJavascript(req: CurlRequest): string {
  const lines: string[] = [];
  if (req.ignored.length) lines.push(`// Not converted: ${req.ignored.join(' ')}`);
  if (req.insecure) lines.push('// curl used -k (skip certificate checks). fetch has no equivalent; fix the certificate instead.');
  const headers = withAuthHeader(req);
  if (req.form) {
    lines.push('const form = new FormData();');
    for (const [k, v] of req.form) lines.push(`form.append(${js(k)}, ${js(v)});`);
    lines.push('');
  }
  const opts: string[] = [];
  if (req.method !== 'GET') opts.push(`  method: ${js(req.method)},`);
  if (headers.length) {
    opts.push('  headers: {');
    for (const [k, v] of headers) opts.push(`    ${js(k)}: ${js(v)},`);
    opts.push('  },');
  }
  if (req.form) opts.push('  body: form,');
  else if (req.body !== undefined) {
    const parsed = isJsonType(headers) ? tryJson(req.body) : { ok: false as const };
    opts.push(parsed.ok ? `  body: JSON.stringify(${indentJson(parsed.value, '  ')}),` : `  body: ${js(req.body)},`);
  }
  lines.push(opts.length ? `const response = await fetch(${js(req.url)}, {\n${opts.join('\n')}\n});` : `const response = await fetch(${js(req.url)});`);
  lines.push('const body = await response.text();', 'console.log(response.status, body);');
  return lines.join('\n');
}

function pyLiteral(v: unknown, depth = 0): string {
  const pad = '    '.repeat(depth + 1);
  const end = '    '.repeat(depth);
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => pad + pyLiteral(x, depth + 1)).join(',\n')},\n${end}]` : '[]';
  const entries = Object.entries(v as Record<string, unknown>);
  return entries.length ? `{\n${entries.map(([k, x]) => `${pad}${JSON.stringify(k)}: ${pyLiteral(x, depth + 1)}`).join(',\n')},\n${end}}` : '{}';
}

export function toPython(req: CurlRequest): string {
  const lines: string[] = [];
  if (req.ignored.length) lines.push(`# Not converted: ${req.ignored.join(' ')}`);
  lines.push('import requests', '');
  const headers = dedupe(req.headers);
  const args: string[] = [`    ${js(req.url)},`];
  if (headers.length) args.push(`    headers=${pyLiteral(Object.fromEntries(headers), 1)},`);
  if (req.form) args.push(`    files={\n${req.form.map(([k, v]) => `        ${js(k)}: (None, ${js(v)}),`).join('\n')}\n    },`);
  else if (req.body !== undefined) {
    const parsed = isJsonType(headers) ? tryJson(req.body) : { ok: false as const };
    args.push(parsed.ok ? `    json=${pyLiteral(parsed.value, 1)},` : `    data=${js(req.body)},`);
  }
  if (req.basicAuth) args.push(`    auth=(${js(req.basicAuth[0])}, ${js(req.basicAuth[1])}),`);
  if (req.insecure) args.push('    verify=False,');
  const fn = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method) ? req.method.toLowerCase() : null;
  if (fn) lines.push(`response = requests.${fn}(\n${args.join('\n')}\n)`);
  else lines.push(`response = requests.request(\n    ${js(req.method)},\n${args.join('\n')}\n)`);
  lines.push('print(response.status_code, response.text)');
  return lines.join('\n');
}

const shq = (s: string) => (/^[A-Za-z0-9_@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/** A clean, multi-line curl command for the same request. */
export function toShell(req: CurlRequest): string {
  const parts: string[] = [`curl ${shq(req.url)}`];
  if (req.method !== 'GET' && !(req.method === 'POST' && (req.body !== undefined || req.form))) parts.push(req.method === 'HEAD' ? '-I' : `-X ${shq(req.method)}`);
  for (const [k, v] of dedupe(req.headers)) parts.push(`-H ${shq(`${k}: ${v}`)}`);
  if (req.basicAuth) parts.push(`-u ${shq(req.basicAuth.join(':'))}`);
  if (req.form) for (const [k, v] of req.form) parts.push(`-F ${shq(`${k}=${v}`)}`);
  else if (req.body !== undefined) parts.push(`--data-raw ${shq(req.body)}`);
  if (req.insecure) parts.push('-k');
  const out = parts.join(' \\\n  ');
  return req.ignored.length ? `# Not converted: ${req.ignored.join(' ')}\n${out}` : out;
}

export function curlToCode(command: string, target: CurlTarget): string {
  const req = parseCurl(command);
  return target === 'javascript' ? toJavascript(req) : target === 'python' ? toPython(req) : toShell(req);
}
