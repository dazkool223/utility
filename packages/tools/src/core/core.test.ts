import { beforeEach, describe, expect, it } from 'vitest';
import { detectFile, detectText } from './detect';
import { searchTools } from './search';
import { TOOLS, getTool, getToolByPath, toolsForKinds } from './registry';
import { CATEGORIES } from './categories';
import { clearPreferences, getPreferences, recordRecent, toggleFavourite } from './preferences';
import { sizeRestriction } from './limits';

describe('registry invariants (every Tool)', () => {
  it('has at least one Tool', () => expect(TOOLS.length).toBeGreaterThan(0));

  it.each(TOOLS.map((t) => [t.id, t] as const))('%s has valid metadata', (_id, tool) => {
    expect(tool.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(tool.path).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/);
    expect(CATEGORIES.some((c) => c.id === tool.category)).toBe(true);
    expect(tool.name.length).toBeGreaterThan(2);
    expect(tool.description.length).toBeGreaterThan(10);
    for (const r of tool.related ?? []) expect(getTool(r), `related id "${r}" must exist`).toBeDefined();
    if (tool.inputKind === 'text') expect(tool.example, 'text Tools need an example for the E2E test').toBeDefined();
    if (tool.heavy) expect(tool.quickLauncher ?? false).toBe(false);
  });

  it('ids and paths are unique', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.path)).size).toBe(TOOLS.length);
  });

  it('looks up by path', () => {
    expect(getToolByPath('/json/format/')?.id).toBe('json-format');
  });
});

describe('detectText (Smart Paste)', () => {
  const cases: Array<[string, string]> = [
    ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', 'jwt'],
    ['{"a": [1, 2]}', 'json'],
    ['[1,2,3]', 'json'],
    ['123e4567-e89b-12d3-a456-426614174000', 'uuid'],
    ['1700000000', 'timestamp'],
    ['1700000000000', 'timestamp'],
    ['https://example.com/a?b=c', 'url'],
    ['*/5 * * * *', 'cron'],
    ['0 0 12 * * ?', 'cron'],
    ['SGVsbG8sIHdvcmxkIQ==', 'base64'],
    ['-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----', 'pem-cert'],
    ['<?xml version="1.0"?><a><b/></a>', 'xml'],
    ['name: x\nlist:\n  - 1', 'yaml'],
    ['a,b,c\n1,2,3\n4,5,6', 'csv'],
    ['#ff8800', 'color'],
    ['192.168.1.10', 'ip'],
    ['10.0.0.0/8', 'cidr'],
    ['SELECT * FROM users', 'sql'],
    ["curl -X POST https://api.example.com -d 'a=1'", 'curl'],
    ['hello%20world', 'url-encoded'],
  ];
  it.each(cases)('%s → %s', (input, kind) => {
    expect(detectText(input)).toContain(kind);
  });

  it('puts the specific kind first', () => {
    expect(detectText('{"a":1}')[0]).toBe('json');
    expect(detectText('1700000000')[0]).toBe('timestamp');
  });

  it('does not call plain words base64 or cron', () => {
    const kinds = detectText('hello world');
    expect(kinds).not.toContain('base64');
    expect(kinds).not.toContain('cron');
    expect(kinds.at(-1)).toBe('text');
  });

  it('does not treat a number list as cron', () => {
    expect(detectText('1 2 3 4 5')).not.toContain('cron');
  });
});

describe('detectFile', () => {
  const blob = (bytes: number[] | string, type = '', name?: string) => {
    const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
    const b = new Blob([data], { type }) as Blob & { name?: string };
    if (name) Object.defineProperty(b, 'name', { value: name });
    return b;
  };
  it('recognises magic bytes', async () => {
    expect(await detectFile(blob('%PDF-1.7'))).toBe('pdf');
    expect(await detectFile(blob([0x89, 0x50, 0x4e, 0x47]))).toBe('image');
    expect(await detectFile(blob([0x1f, 0x8b, 8]))).toBe('gzip');
    expect(await detectFile(blob([0x50, 0x4b, 3, 4]))).toBe('zip');
    expect(await detectFile(blob([0x50, 0x4b, 3, 4], '', 'report.xlsx'))).toBe('xlsx');
    expect(await detectFile(blob('SQLite format 3\0'))).toBe('sqlite');
    expect(await detectFile(blob('plain', 'video/mp4'))).toBe('video');
  });
});

describe('searchTools', () => {
  it('finds by name, alias and prefers exact matches', () => {
    expect(searchTools('json format', TOOLS)[0]?.id).toBe('json-format');
    expect(searchTools('b64', TOOLS)[0]?.id).toBe('base64-text');
    expect(searchTools('guid', TOOLS)[0]?.id).toBe('uuid-generate');
  });
  it('returns everything for an empty query and nothing for garbage', () => {
    expect(searchTools('', TOOLS)).toHaveLength(TOOLS.length);
    expect(searchTools('zzzqqqxxx', TOOLS)).toHaveLength(0);
  });
});

describe('toolsForKinds', () => {
  it('maps detections to Tools', () => {
    expect(toolsForKinds(['json', 'text']).map((t) => t.id)).toContain('json-format');
  });
});

describe('preferences', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
    clearPreferences();
  });
  it('defaults to the dark theme for a new visitor', () => {
    expect(getPreferences().theme).toBe('dark');
  });
  it('toggles favourites and keeps recents unique, newest first, capped', () => {
    toggleFavourite('a');
    expect(getPreferences().favourites).toEqual(['a']);
    toggleFavourite('a');
    expect(getPreferences().favourites).toEqual([]);
    for (const id of ['a', 'b', 'a', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) recordRecent(id);
    expect(getPreferences().recent).toEqual(['i', 'h', 'g', 'f', 'e', 'd', 'c', 'a']);
  });
  it('stores only ids, never content', () => {
    recordRecent('json-format');
    const raw = globalThis.localStorage.getItem('utility:preferences:v1')!;
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['favourites', 'recent', 'theme']);
  });
});

describe('sizeRestriction', () => {
  it('only triggers above the Supported Size', () => {
    expect(sizeRestriction('text', 10)).toBeNull();
    expect(sizeRestriction('text', 60 * 1024 * 1024)).toMatch(/tested up to 50 MB/);
    expect(sizeRestriction('none', 1e12)).toBeNull();
  });
});
