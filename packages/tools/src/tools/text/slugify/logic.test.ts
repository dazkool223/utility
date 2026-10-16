import { describe, expect, it } from 'vitest';
import { DEFAULT_SLUG, slugifyLines } from './logic';

describe('slugifyLines', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugifyLines('Hello World! This is a Test', DEFAULT_SLUG)).toBe('hello-world-this-is-a-test');
  });
  it('transliterates accents and special letters', () => {
    expect(slugifyLines('Crème Brûlée à la Straße', DEFAULT_SLUG)).toBe('creme-brulee-a-la-strasse');
  });
  it('splits camelCase when decamelize is on', () => {
    expect(slugifyLines('fooBarBaz', DEFAULT_SLUG)).toBe('foo-bar-baz');
    expect(slugifyLines('fooBarBaz', { ...DEFAULT_SLUG, decamelize: false })).toBe('foobarbaz');
  });
  it('supports another separator and keeping case', () => {
    expect(slugifyLines('Hello World', { ...DEFAULT_SLUG, separator: '_' })).toBe('hello_world');
    expect(slugifyLines('Hello World', { ...DEFAULT_SLUG, lowercase: false })).toBe('Hello-World');
  });
  it('slugifies each line and collapses symbols', () => {
    expect(slugifyLines('a & b\n\n  --c--  ', DEFAULT_SLUG)).toBe('a-and-b\n\nc');
  });
  it('handles empty and non-Latin input without crashing', () => {
    expect(slugifyLines('', DEFAULT_SLUG)).toBe('');
    expect(slugifyLines('日本語', DEFAULT_SLUG)).toBeTypeOf('string');
  });
  it('handles large input', () => {
    expect(slugifyLines('Some Title Here\n'.repeat(20_000), DEFAULT_SLUG).split('\n')).toHaveLength(20_001);
  });
});
