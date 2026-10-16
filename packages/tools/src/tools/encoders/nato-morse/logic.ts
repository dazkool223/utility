import { ToolError } from '@/core/types';

const NATO_WORDS = ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'Xray', 'Yankee', 'Zulu'];
const NATO_DIGITS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Niner'];

const FROM_NATO = new Map<string, string>();
NATO_WORDS.forEach((w, i) => FROM_NATO.set(w.toLowerCase(), String.fromCharCode(65 + i)));
NATO_DIGITS.forEach((w, i) => FROM_NATO.set(w.toLowerCase(), String(i)));
FROM_NATO.set('alpha', 'A');
FROM_NATO.set('juliet', 'J');
FROM_NATO.set('nine', '9');
FROM_NATO.set('x-ray', 'X');

/** Letters and digits become code words, spaces become "/", other characters are kept as they are. */
export function textToNato(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z' && up.length === 1) return NATO_WORDS[up.charCodeAt(0) - 65]!;
      if (ch >= '0' && ch <= '9') return NATO_DIGITS[Number(ch)]!;
      if (ch === ' ') return '/';
      if (ch === '\n') return '\n';
      return ch;
    })
    .join(' ')
    .replace(/ ?\n ?/g, '\n');
}

export function natoToText(input: string): string {
  return input
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => {
          if (tok === '/') return ' ';
          const hit = FROM_NATO.get(tok.toLowerCase().replace(/[,.]$/, ''));
          if (hit) return hit;
          if (tok.length === 1) return tok;
          throw new ToolError(`"${tok}" is not a NATO code word. Use words like Alfa, Bravo, Charlie, or "/" between words.`);
        })
        .join(''),
    )
    .join('\n');
}

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};
const FROM_MORSE = new Map(Object.entries(MORSE).map(([k, v]) => [v, k]));

export function textToMorse(text: string): string {
  const bad = new Set<string>();
  const out = text
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) =>
          Array.from(word.toUpperCase())
            .map((ch) => {
              const code = MORSE[ch];
              if (!code) bad.add(ch);
              return code ?? '';
            })
            .join(' '),
        )
        .join(' / '),
    )
    .join('\n');
  if (bad.size) throw new ToolError(`Morse code has no symbol for: ${[...bad].join(' ')}`);
  return out;
}

export function morseToText(input: string): string {
  const norm = input.replace(/[·•]/g, '.').replace(/[−–—_]/g, '-');
  return norm
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s*\/\s*|\s{3,}/)
        .filter(Boolean)
        .map((word) =>
          word
            .trim()
            .split(/\s+/)
            .map((code) => {
              const ch = FROM_MORSE.get(code);
              if (!ch) throw new ToolError(`"${code}" is not a Morse code. Use dots and dashes, a space between letters and "/" between words.`);
              return ch;
            })
            .join(''),
        )
        .join(' '),
    )
    .join('\n');
}
