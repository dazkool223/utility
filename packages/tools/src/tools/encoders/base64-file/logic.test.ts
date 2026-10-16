import { describe, expect, it } from 'vitest';
import { extensionFor, formatOutput, parseBase64Input, sniffMime } from './logic';

// 1x1 transparent PNG
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('sniffMime', () => {
  it('recognises common formats', () => {
    expect(sniffMime(Uint8Array.from(atob(PNG_B64), (c) => c.charCodeAt(0)))).toBe('image/png');
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(new TextEncoder().encode('GIF89a'))).toBe('image/gif');
    expect(sniffMime(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf');
    expect(sniffMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('image/svg+xml');
    expect(sniffMime(new Uint8Array([1, 2, 3]))).toBe('application/octet-stream');
  });
});

describe('formatOutput', () => {
  const uri = 'data:image/png;base64,AAAA';
  it('formats each style', () => {
    expect(formatOutput(uri, 'data-uri')).toBe(uri);
    expect(formatOutput(uri, 'base64')).toBe('AAAA');
    expect(formatOutput(uri, 'css')).toBe('url("data:image/png;base64,AAAA")');
    expect(formatOutput(uri, 'html')).toBe('<img src="data:image/png;base64,AAAA" alt="">');
  });
});

describe('parseBase64Input', () => {
  it('parses a data URI', () => {
    const r = parseBase64Input('data:image/png;base64,' + PNG_B64);
    expect(r.mime).toBe('image/png');
    expect(r.bytes[0]).toBe(0x89);
  });
  it('parses bare Base64 and sniffs the type', () => {
    expect(parseBase64Input(PNG_B64).mime).toBe('image/png');
    expect(parseBase64Input(PNG_B64.slice(0, 40) + '\n' + PNG_B64.slice(40)).bytes.length).toBeGreaterThan(50);
  });
  it('extracts a data URI from CSS or HTML', () => {
    expect(parseBase64Input(`url("data:image/png;base64,${PNG_B64}")`).mime).toBe('image/png');
    expect(parseBase64Input(`<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="">`).mime).toBe('image/gif');
  });
  it('parses URL-encoded, non-Base64 data URIs', () => {
    const r = parseBase64Input('data:text/plain,hello%20world');
    expect(new TextDecoder().decode(r.bytes)).toBe('hello world');
    expect(r.mime).toBe('text/plain');
  });
  it('maps MIME types to file extensions', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('weird/type')).toBe('bin');
  });
  it('rejects empty and invalid input', () => {
    expect(() => parseBase64Input('')).toThrow(/Paste/);
    expect(() => parseBase64Input('abc$')).toThrow(/not valid Base64/);
    expect(() => parseBase64Input('abcde')).toThrow(/length/);
  });
  it('handles a large payload', () => {
    const big = btoa('x'.repeat(3_000_000));
    expect(parseBase64Input('data:application/octet-stream;base64,' + big).bytes.length).toBe(3_000_000);
  });
});
