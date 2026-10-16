import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { averageConfidence, classifyInput, joinPages, latin1Safe, outputName, placeWord, wordsFromBlocks } from './logic';
import { createSearchablePdf } from './searchable';

// A 1×1 white PNG.
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));

describe('wordsFromBlocks', () => {
  it('flattens the tree and drops blank words', () => {
    const bbox = { x0: 1, y0: 2, x1: 3, y1: 4 };
    const words = wordsFromBlocks([{ paragraphs: [{ lines: [{ words: [{ text: ' Hi ', bbox }, { text: '  ', bbox }] }, { words: [{ text: 'there', bbox }] }] }] }]);
    expect(words.map((w) => w.text)).toEqual(['Hi', 'there']);
    expect(words[0]).toEqual({ text: 'Hi', x0: 1, y0: 2, x1: 3, y1: 4 });
  });
  it('copes with nothing', () => {
    expect(wordsFromBlocks(null)).toEqual([]);
    expect(wordsFromBlocks(undefined)).toEqual([]);
  });
});

describe('latin1Safe', () => {
  it('keeps Latin-1 and swaps curly quotes and dashes', () => {
    expect(latin1Safe('café “x” – it’s')).toBe('café "x" - it\'s');
  });
  it('replaces anything the PDF font cannot write', () => {
    expect(latin1Safe('日本 ok €')).toBe('?? ok ?');
  });
});

describe('placeWord', () => {
  it('maps pixels to points and flips the vertical axis', () => {
    const p = placeWord({ text: 'Hi', x0: 200, y0: 100, x1: 400, y1: 150 }, 2, 800, 2);
    expect(p.x).toBe(100);
    expect(p.size).toBeCloseTo(40, 5); // 100pt wide / 2 per size unit = 50, capped at 1.6 × 25pt
    expect(p.y).toBeCloseTo(800 - 75 + 5, 5);
  });
  it('never returns a size below 2', () => {
    expect(placeWord({ text: 'i', x0: 0, y0: 0, x1: 1, y1: 1 }, 10, 100, 1).size).toBe(2);
  });
});

describe('joinPages / averageConfidence', () => {
  it('returns a single page as is, and labels several', () => {
    expect(joinPages(['one\n'])).toBe('one');
    expect(joinPages(['a', 'b'], [2, 5])).toBe('--- Page 2 ---\na\n\n--- Page 5 ---\nb');
    expect(joinPages([])).toBe('');
  });
  it('weights confidence by word count', () => {
    expect(averageConfidence([{ confidence: 90, words: [1, 2, 3] }, { confidence: 60, words: [1] }, { confidence: 10, words: [] }])).toBe(82.5);
    expect(averageConfidence([])).toBe(0);
  });
});

describe('names and input classification', () => {
  it('names outputs', () => {
    expect(outputName('scan.final.pdf', 'pdf')).toBe('scan.final-searchable.pdf');
    expect(outputName('scan.pdf', 'txt')).toBe('scan.txt');
  });
  it('takes one PDF or several pictures, not both', () => {
    const pdf = { type: 'application/pdf', name: 'a.pdf' };
    const img = { type: 'image/png', name: 'b.png' };
    expect(classifyInput([pdf])).toEqual({ pdf, images: [] });
    expect(classifyInput([img, img]).images).toHaveLength(2);
    expect(() => classifyInput([pdf, img])).toThrow(/not both/);
    expect(classifyInput([{ type: '', name: 'notes.txt' }])).toEqual({ pdf: null, images: [] });
  });
});

describe('createSearchablePdf', () => {
  it('makes pages of the requested size with the picture on them', async () => {
    const sheet = await createSearchablePdf();
    await sheet.addPage({ image: PNG, kind: 'png', widthPt: 300, heightPt: 400, scale: 2, words: [{ text: 'Hello', x0: 20, y0: 20, x1: 120, y1: 60 }, { text: '日本', x0: 20, y0: 80, x1: 80, y1: 100 }] });
    await sheet.addPage({ image: PNG, kind: 'png', widthPt: 100, heightPt: 100, scale: 1, words: [] });
    expect(sheet.pageCount()).toBe(2);
    const reloaded = await PDFDocument.load(await sheet.save());
    expect(reloaded.getPageCount()).toBe(2);
    expect(reloaded.getPage(0).getSize()).toEqual({ width: 300, height: 400 });
  });
});
