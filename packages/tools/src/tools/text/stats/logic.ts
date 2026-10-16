export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  readingSeconds: number;
  speakingSeconds: number;
  longestWord: string;
  averageWordLength: number;
  topWords: Array<[string, number]>;
}

const READING_WPM = 238;
const SPEAKING_WPM = 150;

function count(segmenter: Intl.Segmenter, text: string, pred?: (s: Intl.SegmentData) => boolean): number {
  let n = 0;
  for (const s of segmenter.segment(text)) if (!pred || pred(s)) n++;
  return n;
}

export function textStats(text: string): TextStats {
  const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const wordSeg = new Intl.Segmenter(undefined, { granularity: 'word' });
  const sentenceSeg = new Intl.Segmenter(undefined, { granularity: 'sentence' });

  const characters = count(graphemes, text);
  const charactersNoSpaces = count(graphemes, text, (s) => !/^\s+$/.test(s.segment));
  const freq = new Map<string, number>();
  let words = 0;
  let totalLen = 0;
  let longestWord = '';
  for (const s of wordSeg.segment(text)) {
    if (!s.isWordLike) continue;
    words++;
    const w = s.segment;
    totalLen += w.length;
    if (w.length > longestWord.length) longestWord = w;
    const key = w.toLowerCase();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const sentences = count(sentenceSeg, text, (s) => /[\p{L}\p{N}]/u.test(s.segment));
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
  const topWords = [...freq].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 10);
  return {
    characters,
    charactersNoSpaces,
    words,
    uniqueWords: freq.size,
    sentences,
    paragraphs,
    lines,
    bytes: new TextEncoder().encode(text).length,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
    longestWord,
    averageWordLength: words ? Math.round((totalLen / words) * 10) / 10 : 0,
    topWords,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 1) return 'under a second';
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export function statsRows(s: TextStats): Array<[string, string]> {
  return [
    ['Characters', String(s.characters)],
    ['Characters (no spaces)', String(s.charactersNoSpaces)],
    ['Words', String(s.words)],
    ['Unique words', String(s.uniqueWords)],
    ['Sentences', String(s.sentences)],
    ['Paragraphs', String(s.paragraphs)],
    ['Lines', String(s.lines)],
    ['Size (UTF-8)', `${s.bytes} bytes`],
    ['Reading time', formatDuration(s.readingSeconds)],
    ['Speaking time', formatDuration(s.speakingSeconds)],
    ['Average word length', String(s.averageWordLength)],
    ['Longest word', s.longestWord || '-'],
    ['Most used words', s.topWords.map(([w, n]) => `${w} (${n})`).join(', ') || '-'],
  ];
}

export function statsReport(text: string): string {
  return statsRows(textStats(text))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}
