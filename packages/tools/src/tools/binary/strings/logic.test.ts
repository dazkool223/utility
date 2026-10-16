import { describe, expect, it } from 'vitest';
import { DEFAULT_STRINGS, extractStrings, extractStringsFromBlob, formatStrings, StringScanner } from './logic';

const bytes = (...parts: Array<string | number[]>) => new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)));
const utf16le = (s: string) => [...s].flatMap((c) => [c.charCodeAt(0), 0]);
const utf16be = (s: string) => [...s].flatMap((c) => [0, c.charCodeAt(0)]);

describe('extractStrings', () => {
  it('finds ASCII runs with offsets', () => {
    const data = bytes([0, 1, 2], 'Hello', [0, 0xff], 'ab', [0], 'World!', [0]);
    const { strings } = extractStrings(data);
    expect(strings.map((s) => [s.offset, s.text])).toEqual([
      [3, 'Hello'],
      [13, 'World!'],
    ]);
  });
  it('honours the minimum length', () => {
    const data = bytes('ab', [0], 'abc', [0], 'abcd');
    expect(extractStrings(data, { ...DEFAULT_STRINGS, minLength: 3 }).strings.map((s) => s.text)).toEqual(['abc', 'abcd']);
    expect(extractStrings(data, { ...DEFAULT_STRINGS, minLength: 1, encodings: ['ascii'] }).strings).toHaveLength(3);
  });
  it('treats tab as printable but not newline', () => {
    expect(extractStrings(bytes('a\tbcd\nefgh')).strings.map((s) => s.text)).toEqual(['a\tbcd', 'efgh']);
  });
  it('finds UTF-16LE text at any alignment', () => {
    const data = bytes([0xff], utf16le('Wide text'), [0xff, 0xff], 'ascii');
    const { strings } = extractStrings(data);
    expect(strings.map((s) => [s.encoding, s.text, s.offset])).toEqual([
      ['utf16le', 'Wide text', 1],
      ['ascii', 'ascii', 21],
    ]);
  });
  it('finds UTF-16BE only when asked', () => {
    const data = bytes(utf16be('Big endian'));
    expect(extractStrings(data).strings.filter((s) => s.encoding === 'utf16be')).toHaveLength(0);
    const be = extractStrings(data, { ...DEFAULT_STRINGS, encodings: ['utf16be'] }).strings;
    expect(be[0]).toMatchObject({ text: 'Big endian', offset: 0 });
  });
  it('can search only wide text', () => {
    const data = bytes('plain', [0xff, 0xff], utf16le('wide'));
    expect(extractStrings(data, { ...DEFAULT_STRINGS, encodings: ['utf16le'] }).strings.map((s) => s.text)).toEqual(['wide']);
  });
  it('handles empty input and non-text', () => {
    expect(extractStrings(new Uint8Array()).strings).toEqual([]);
    expect(extractStrings(new Uint8Array(1000).fill(0xff)).strings).toEqual([]);
  });
  it('caps the number of results', () => {
    const data = bytes(...Array.from({ length: 20 }, () => 'abcd\0'));
    const r = extractStrings(data, { ...DEFAULT_STRINGS, maxResults: 5 });
    expect(r.strings).toHaveLength(5);
    expect(r.truncated).toBe(true);
  });
  it('validates options', () => {
    expect(() => new StringScanner({ ...DEFAULT_STRINGS, minLength: 0 })).toThrow('minimum length');
    expect(() => new StringScanner({ ...DEFAULT_STRINGS, encodings: [] })).toThrow('at least one encoding');
  });
});

describe('chunked scanning', () => {
  it('gives the same result when a string spans chunks', () => {
    const data = bytes([1], 'across the boundary', [0], utf16le('wide across'), [2]);
    const whole = extractStrings(data).strings;
    for (const size of [1, 2, 3, 7]) {
      const s = new StringScanner(DEFAULT_STRINGS);
      for (let i = 0; i < data.length; i += size) s.push(data.subarray(i, i + size));
      expect(s.finish()).toEqual(whole);
    }
  });
  it('reads a Blob in chunks', async () => {
    const data = bytes([0], 'from a blob', [0]);
    const progress: number[] = [];
    const r = await extractStringsFromBlob(new Blob([data]), DEFAULT_STRINGS, (f) => progress.push(f));
    expect(r.strings[0]).toMatchObject({ text: 'from a blob', offset: 1 });
    expect(progress.at(-1)).toBe(1);
  });
});

describe('formatStrings', () => {
  it('prints with and without offsets', () => {
    const { strings } = extractStrings(bytes([0], 'hello', [0xff, 0xff], utf16le('wide!')));
    expect(formatStrings(strings, false)).toBe('hello\nwide!');
    expect(formatStrings(strings, true)).toBe('00000001  hello\n00000008  wide! [utf-16le]');
  });
});
