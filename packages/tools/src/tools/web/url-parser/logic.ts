import { ToolError } from '@/core/types';

export interface ParsedUrl {
  href: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  origin: string;
  pathname: string;
  /** Path segments, percent-decoded. */
  segments: string[];
  search: string;
  params: Array<[string, string]>;
  hash: string;
}

export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim();
  if (!raw) throw new ToolError('Enter a URL, for example https://example.com/path?x=1#top.');
  if (/\s/.test(raw)) throw new ToolError('A URL cannot contain spaces. Encode them as %20 or remove them.');
  const bad = () => new ToolError(`"${raw.length > 60 ? raw.slice(0, 60) + '…' : raw}" is not a valid URL.`);
  let u: URL;
  // "host:port/path" would otherwise be read as a scheme, and "example.com/path" has none at all.
  const hostPort = /^[^/\s:@]+:\d+([/?#]|$)/.test(raw);
  try {
    u = new URL(hostPort ? 'https://' + raw : raw);
  } catch {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) throw bad();
    try {
      u = new URL('https://' + raw.replace(/^\/\//, ''));
    } catch {
      throw bad();
    }
  }
  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  return {
    href: u.href,
    protocol: u.protocol,
    username: safeDecode(u.username),
    password: safeDecode(u.password),
    host: u.host,
    hostname: u.hostname,
    port: u.port,
    origin: u.origin,
    pathname: u.pathname,
    segments: u.pathname.split('/').filter(Boolean).map(safeDecode),
    search: u.search,
    params: [...u.searchParams.entries()],
    hash: u.hash,
  };
}

export function urlRows(p: ParsedUrl): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Protocol', p.protocol],
    ['Host', p.host],
    ['Hostname', p.hostname],
    ['Port', p.port || '(default)'],
    ['Origin', p.origin],
    ['Path', p.pathname],
  ];
  if (p.username || p.password) rows.splice(1, 0, ['Username', p.username], ['Password', p.password]);
  rows.push(['Query', p.search || '(none)'], ['Fragment', p.hash || '(none)']);
  p.segments.forEach((s, i) => rows.push([`Path segment ${i + 1}`, s]));
  p.params.forEach(([k, v], i) => rows.push([`Param ${i + 1}: ${k}`, v]));
  return rows;
}

/** Readable report. */
export function describeUrl(input: string): string {
  const rows = urlRows(parseUrl(input));
  const width = Math.max(...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => `${k.padEnd(width)}  ${v}`).join('\n');
}

/** The parts as JSON, with query parameters grouped by name. */
export function urlToJson(input: string): string {
  const p = parseUrl(input);
  const query: Record<string, string | string[]> = {};
  for (const [k, v] of p.params) {
    const prev = query[k];
    query[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return JSON.stringify(
    {
      protocol: p.protocol,
      username: p.username,
      password: p.password,
      hostname: p.hostname,
      port: p.port,
      pathname: p.pathname,
      query,
      hash: p.hash,
    },
    null,
    2,
  );
}

/** Just the query parameters, one key=value per line, decoded. */
export function urlQueryLines(input: string): string {
  return parseUrl(input)
    .params.map(([k, v]) => `${k}=${v}`)
    .join('\n');
}
