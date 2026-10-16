import { describe, expect, it } from 'vitest';
import { decodeEntities, encodeEntities } from './logic';

describe('HTML entities', () => {
  it('escapes only the unsafe characters in minimal mode', () => {
    expect(encodeEntities(`<a href="x">T&C 'q' é</a>`, 'minimal')).toBe('&lt;a href=&quot;x&quot;&gt;T&amp;C &#x27;q&#x27; é&lt;/a&gt;');
  });
  it('uses named references where they exist', () => {
    expect(encodeEntities('café © <b>', 'named')).toBe('caf&eacute; &copy; &lt;b&gt;');
  });
  it('can use hex or decimal references for non-ASCII', () => {
    expect(encodeEntities('é✓', 'hex')).toBe('&#xE9;&#x2713;');
    expect(encodeEntities('é✓', 'decimal')).toBe('&#233;&#10003;');
  });
  it('decodes named, decimal and hex references', () => {
    expect(decodeEntities('&lt;p&gt;caf&eacute; &#233; &#xE9; &amp;amp; &hearts;')).toBe('<p>café é é &amp; ♥');
  });
  it('round-trips emoji and astral characters', () => {
    expect(decodeEntities(encodeEntities('🙂 a<b', 'hex'))).toBe('🙂 a<b');
  });
  it('leaves unknown entities and empty input alone', () => {
    expect(decodeEntities('&bogus; x')).toBe('&bogus; x');
    expect(decodeEntities('')).toBe('');
  });
  it('handles large input', () => {
    const s = '<&>é'.repeat(100_000);
    expect(decodeEntities(encodeEntities(s, 'named'))).toBe(s);
  });
});
