import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ToolError } from '@/core/types';
import { readMediaInfo } from '../info/logic';
import { AUDIO_FORMATS, DEFAULT_AUDIO_OPTIONS, convertAudio, outputFileName, parseTime, validateTrim } from './logic';

const fixture = (name: string) => new Blob([readFileSync(fileURLToPath(new URL(`../../../../../../apps/web/e2e/fixtures/${name}`, import.meta.url)))]);
const opts = (o: Partial<typeof DEFAULT_AUDIO_OPTIONS>) => ({ ...DEFAULT_AUDIO_OPTIONS, ...o });

describe('parseTime', () => {
  it('parses seconds and clock times', () => {
    expect(parseTime('')).toBeNull();
    expect(parseTime('  ')).toBeNull();
    expect(parseTime('90')).toBe(90);
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('1:02:03.5')).toBe(3723.5);
    expect(parseTime('0.25')).toBe(0.25);
  });
  it('flags garbage as NaN', () => {
    expect(parseTime('abc')).toBeNaN();
    expect(parseTime('1:2:3:4')).toBeNaN();
    expect(parseTime('-5')).toBeNaN();
    expect(parseTime('1:')).toBeNaN();
  });
});

describe('validateTrim', () => {
  it('accepts sane ranges', () => {
    expect(() => validateTrim(0, null, 10)).not.toThrow();
    expect(() => validateTrim(1, 2, 10)).not.toThrow();
    expect(() => validateTrim(1, 50, 10)).not.toThrow();
  });
  it('rejects bad ranges with plain messages', () => {
    expect(() => validateTrim(-1, null, 10)).toThrow(ToolError);
    expect(() => validateTrim(5, 5, 10)).toThrow(/after the trim start/);
    expect(() => validateTrim(5, 2, 10)).toThrow(/after the trim start/);
    expect(() => validateTrim(10, null, 10)).toThrow(/end of the audio/);
    expect(() => validateTrim(Number.NaN, null, 10)).toThrow(ToolError);
  });
});

describe('outputFileName', () => {
  it('swaps the extension and marks trims', () => {
    expect(outputFileName('song.flac', 'mp3', false)).toBe('song.mp3');
    expect(outputFileName('my.song.wav', 'ogg', true)).toBe('my.song-trimmed.ogg');
    expect(outputFileName('noext', 'wav', false)).toBe('noext.wav');
    expect(outputFileName('', 'm4a', false)).toBe('audio.m4a');
  });
  it('has consistent format specs', () => {
    for (const [id, spec] of Object.entries(AUDIO_FORMATS)) expect(spec.id).toBe(id);
  });
});

describe('convertAudio (software paths that work without WebCodecs)', () => {
  it('converts WAV to WAV with a trim', async () => {
    const result = await convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'wav', trimStart: 0.25, trimEnd: 0.75 }));
    expect(result.name).toBe('tone-trimmed.wav');
    const info = await readMediaInfo(result.blob);
    expect(info.format).toMatch(/wav/i);
    expect(info.durationSec).toBeGreaterThan(0.45);
    expect(info.durationSec).toBeLessThan(0.55);
  });

  it('downmixes and resamples WAV', async () => {
    const result = await convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'wav', sampleRate: 16000, channels: 'stereo' }));
    const t = (await readMediaInfo(result.blob)).tracks[0]!;
    expect(t.sampleRate).toBe(16000);
    expect(t.channels).toBe(2);
  });

  it('encodes MP3 with LAME', async () => {
    const result = await convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'mp3', bitrateKbps: 128 }));
    expect(result.name).toBe('tone.mp3');
    const info = await readMediaInfo(result.blob);
    expect(info.format).toMatch(/mp3/i);
    expect(info.durationSec).toBeGreaterThan(0.9);
  }, 30_000);

  it('encodes FLAC', async () => {
    const result = await convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'flac' }));
    expect((await readMediaInfo(result.blob)).format).toMatch(/flac/i);
  }, 30_000);

  it('reports progress', async () => {
    const seen: number[] = [];
    await convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'wav' }), (p) => seen.push(p));
    expect(seen.length).toBeGreaterThan(0);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1);
  });

  it('rejects input that is not media', async () => {
    await expect(convertAudio(new Blob(['not audio at all'.repeat(30)]), 'x.txt', opts({ format: 'wav' }))).rejects.toThrow(ToolError);
  });

  it('rejects a trim start past the end', async () => {
    await expect(convertAudio(fixture('media-tone.wav'), 'tone.wav', opts({ format: 'wav', trimStart: 5 }))).rejects.toThrow(/end of the audio/);
  });
});
