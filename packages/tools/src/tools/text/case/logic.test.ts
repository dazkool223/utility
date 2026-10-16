import { describe, expect, it } from 'vitest';
import { allCases, convertCase } from './logic';

describe('convertCase', () => {
  it('converts identifiers cases', () => {
    const s = 'hello world foo';
    expect(convertCase(s, 'camel')).toBe('helloWorldFoo');
    expect(convertCase(s, 'pascal')).toBe('HelloWorldFoo');
    expect(convertCase(s, 'snake')).toBe('hello_world_foo');
    expect(convertCase(s, 'kebab')).toBe('hello-world-foo');
    expect(convertCase(s, 'constant')).toBe('HELLO_WORLD_FOO');
    expect(convertCase(s, 'dot')).toBe('hello.world.foo');
    expect(convertCase(s, 'path')).toBe('hello/world/foo');
    expect(convertCase(s, 'train')).toBe('Hello-World-Foo');
    expect(convertCase(s, 'pascal-snake')).toBe('Hello_World_Foo');
  });
  it('splits existing camelCase and snake_case input', () => {
    expect(convertCase('someVariable_name-here', 'kebab')).toBe('some-variable-name-here');
    expect(convertCase('XMLHttpRequest', 'snake')).toBe('xml_http_request');
  });
  it('handles sentence, title, upper, lower and swap', () => {
    expect(convertCase('the QUICK brown fox', 'sentence')).toBe('The quick brown fox');
    expect(convertCase('the lord of the rings', 'title')).toBe('The Lord of the Rings');
    expect(convertCase('Hello', 'upper')).toBe('HELLO');
    expect(convertCase('Hello', 'lower')).toBe('hello');
    expect(convertCase('Hello World', 'swap')).toBe('hELLO wORLD');
  });
  it('converts line by line and keeps blank lines', () => {
    expect(convertCase('foo bar\n\nbaz qux', 'snake')).toBe('foo_bar\n\nbaz_qux');
  });
  it('handles unicode and empty input', () => {
    expect(convertCase('élan vital', 'pascal')).toBe('ÉlanVital');
    expect(convertCase('', 'camel')).toBe('');
  });
  it('lists every case', () => {
    const out = allCases('hello world');
    expect(out).toContain('camelCase');
    expect(out).toContain('helloWorld');
    expect(out).toContain('HELLO_WORLD');
    expect(allCases('a b\nc d').split('\n\n')).toHaveLength(2);
  });
  it('handles large input', () => {
    const big = 'some words here\n'.repeat(100_000);
    expect(convertCase(big, 'snake').split('\n')).toHaveLength(100_001);
  });
});
