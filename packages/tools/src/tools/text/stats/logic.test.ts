import { describe, expect, it } from 'vitest';
import { formatDuration, statsReport, textStats } from './logic';

describe('textStats', () => {
  it('counts the basics', () => {
    const s = textStats('Hello world. This is a test.\n\nSecond paragraph here!');
    expect(s.words).toBe(9);
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.lines).toBe(3);
    expect(s.characters).toBe(52);
    expect(s.charactersNoSpaces).toBe(43);
  });
  it('counts user-perceived characters for emoji and accents', () => {
    expect(textStats('🙂👍🏽').characters).toBe(2);
    expect(textStats('é').characters).toBe(1);
    expect(textStats('é✓🙂').bytes).toBe(9);
  });
  it('finds the longest word, unique words and top words', () => {
    const s = textStats('the cat and the hat and the bat');
    expect(s.uniqueWords).toBe(5);
    expect(s.topWords[0]).toEqual(['the', 3]);
    expect(s.longestWord).toBe('the');
    expect(textStats('short extraordinary').longestWord).toBe('extraordinary');
  });
  it('is case-insensitive for unique words', () => {
    expect(textStats('Word word WORD').uniqueWords).toBe(1);
  });
  it('estimates reading and speaking time', () => {
    const s = textStats('word '.repeat(238));
    expect(s.readingSeconds).toBe(60);
    expect(s.speakingSeconds).toBe(95);
  });
  it('handles empty input', () => {
    const s = textStats('');
    expect([s.characters, s.words, s.sentences, s.paragraphs, s.lines, s.bytes]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(s.averageWordLength).toBe(0);
  });
  it('counts words in Chinese and Japanese text', () => {
    expect(textStats('今日は天気がいいです').words).toBeGreaterThan(1);
  });
  it('handles large input', () => {
    const s = textStats('The quick brown fox jumps over the lazy dog. '.repeat(50_000));
    expect(s.words).toBe(450_000);
    expect(s.sentences).toBe(50_000);
  });
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('under a second');
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(125)).toBe('2 min 5 sec');
    expect(formatDuration(120)).toBe('2 min');
  });
  it('prints a report', () => {
    expect(statsReport('a b c')).toContain('Words: 3');
  });
});
