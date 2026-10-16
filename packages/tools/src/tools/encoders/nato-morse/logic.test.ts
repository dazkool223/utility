import { describe, expect, it } from 'vitest';
import { morseToText, natoToText, textToMorse, textToNato } from './logic';

describe('NATO alphabet', () => {
  it('spells letters, digits and spaces', () => {
    expect(textToNato('Hi 5')).toBe('Hotel India / Five');
  });
  it('keeps punctuation and newlines', () => {
    expect(textToNato('a-b\nc')).toBe('Alfa - Bravo\nCharlie');
  });
  it('decodes code words in any case, with common variants', () => {
    expect(natoToText('hotel INDIA / Five')).toBe('HI 5');
    expect(natoToText('Alpha Juliet Nine')).toBe('AJ9');
  });
  it('round-trips letters and digits', () => {
    expect(natoToText(textToNato('HELLO 2024'))).toBe('HELLO 2024');
  });
  it('handles empty input and non-Latin letters', () => {
    expect(textToNato('')).toBe('');
    expect(natoToText('')).toBe('');
    expect(textToNato('é')).toBe('é');
  });
  it('rejects unknown words', () => {
    expect(() => natoToText('Alfa Banana')).toThrow(/not a NATO code word/);
  });
  it('handles large input', () => {
    const s = 'ABC '.repeat(50_000).trim();
    expect(natoToText(textToNato(s))).toBe(s);
  });
});

describe('Morse code', () => {
  it('encodes letters, words and digits', () => {
    expect(textToMorse('SOS 1')).toBe('... --- ... / .----');
  });
  it('is case-insensitive and supports punctuation', () => {
    expect(textToMorse('hi?')).toBe('.... .. ..--..');
  });
  it('decodes with / or wide gaps between words', () => {
    expect(morseToText('... --- ... / .----')).toBe('SOS 1');
    expect(morseToText('.-   -...')).toBe('A B');
  });
  it('accepts typographic dots and dashes', () => {
    expect(morseToText('•− −•••')).toBe('AB');
  });
  it('keeps lines', () => {
    expect(morseToText(textToMorse('A\nB'))).toBe('A\nB');
  });
  it('rejects unsupported characters and invalid codes', () => {
    expect(() => textToMorse('é')).toThrow(/no symbol for: É/);
    expect(() => morseToText('.-.-.-.-.-')).toThrow(/not a Morse code/);
  });
  it('handles empty input and large input', () => {
    expect(textToMorse('')).toBe('');
    const s = 'HELLO WORLD '.repeat(20_000).trim();
    expect(morseToText(textToMorse(s))).toBe(s);
  });
});
