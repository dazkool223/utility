import { describe, expect, it } from 'vitest';
import { describeUrl, parseUrl, urlQueryLines, urlToJson } from './logic';

describe('parseUrl', () => {
  it('splits a full URL', () => {
    const p = parseUrl('https://user:p%40ss@example.com:8080/a/b%20c/?x=1&y=two+words&x=3#frag');
    expect(p).toMatchObject({
      protocol: 'https:',
      username: 'user',
      password: 'p@ss',
      hostname: 'example.com',
      port: '8080',
      origin: 'https://example.com:8080',
      pathname: '/a/b%20c/',
      segments: ['a', 'b c'],
      hash: '#frag',
    });
    expect(p.params).toEqual([
      ['x', '1'],
      ['y', 'two words'],
      ['x', '3'],
    ]);
  });
  it('adds https when the scheme is missing', () => {
    expect(parseUrl('example.com/path').href).toBe('https://example.com/path');
    expect(parseUrl('//example.com').hostname).toBe('example.com');
    expect(parseUrl('localhost:3000/x').port).toBe('3000');
  });
  it('handles non-http schemes and IDNs', () => {
    expect(parseUrl('mailto:me@example.com').protocol).toBe('mailto:');
    expect(parseUrl('https://münchen.de').hostname).toBe('xn--mnchen-3ya.de');
  });
  it('keeps bad percent encoding readable', () => {
    expect(parseUrl('https://a.test/%E0%A4%A').segments).toEqual(['%E0%A4%A']);
  });
  it('rejects bad input', () => {
    expect(() => parseUrl('')).toThrow('Enter a URL');
    expect(() => parseUrl('http://exa mple.com')).toThrow('spaces');
    expect(() => parseUrl('http://')).toThrow('not a valid URL');
    expect(() => parseUrl('http://[::')).toThrow('not a valid URL');
  });
});

describe('reports', () => {
  it('describes', () => {
    const out = describeUrl('https://example.com/a?q=1');
    expect(out).toMatch(/Hostname\s+example\.com/);
    expect(out).toMatch(/Param 1: q\s+1/);
  });
  it('groups repeated params in JSON', () => {
    expect(JSON.parse(urlToJson('https://e.com/?a=1&a=2&b=3')).query).toEqual({ a: ['1', '2'], b: '3' });
  });
  it('lists query lines', () => {
    expect(urlQueryLines('https://e.com/?a=1&b=x%20y')).toBe('a=1\nb=x y');
    expect(urlQueryLines('https://e.com/')).toBe('');
  });
});
