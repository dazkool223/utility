import { describe, expect, it } from 'vitest';
import { jsonToXml, xmlToJson } from './logic';

const o = { attributes: true, types: true };

describe('xmlToJson', () => {
  it('converts elements, attributes and repeated tags', () => {
    expect(JSON.parse(xmlToJson('<r x="1"><i>a</i><i>b</i><n>5</n></r>', o))).toEqual({ r: { '@_x': 1, i: ['a', 'b'], n: 5 } });
  });
  it('can drop attributes and keep text as strings', () => {
    expect(JSON.parse(xmlToJson('<r x="1"><n>5</n></r>', { attributes: false, types: false }))).toEqual({ r: { n: '5' } });
  });
  it('ignores the XML declaration and handles unicode', () => {
    expect(JSON.parse(xmlToJson('<?xml version="1.0"?><r>é✓</r>', o))).toEqual({ r: 'é✓' });
  });
  it('rejects malformed XML', () => {
    expect(() => xmlToJson('<a><b></a>', o)).toThrow(/Not well-formed XML/);
  });
  it('handles large input', () => {
    const big = '<r>' + '<i>1</i>'.repeat(50_000) + '</r>';
    expect(JSON.parse(xmlToJson(big, o)).r.i).toHaveLength(50_000);
  });
});

describe('jsonToXml', () => {
  it('converts objects with attributes and arrays', () => {
    expect(jsonToXml('{"r":{"@_x":"1","i":["a","b"]}}')).toBe('<r x="1">\n  <i>a</i>\n  <i>b</i>\n</r>');
  });
  it('wraps multiple top-level keys and arrays in a root', () => {
    expect(jsonToXml('{"a":1,"b":2}', 0)).toBe('<root><a>1</a><b>2</b></root>');
    expect(jsonToXml('[1,2]', 0)).toBe('<root><item>1</item><item>2</item></root>');
  });
  it('round-trips', () => {
    const xml = '<r><i>a</i><i>b</i></r>';
    expect(jsonToXml(xmlToJson(xml, o), 0)).toBe(xml);
  });
  it('escapes special characters', () => {
    expect(jsonToXml('{"r":"a < b & c"}', 0)).toBe('<r>a &lt; b &amp; c</r>');
  });
  it('rejects scalars and invalid JSON', () => {
    expect(() => jsonToXml('5')).toThrow(/top level/);
    expect(() => jsonToXml('{')).toThrow(/Invalid JSON/);
  });
});
