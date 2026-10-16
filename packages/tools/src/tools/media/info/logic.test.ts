import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ToolError } from '@/core/types';
import { channelLabel, codecLabel, formatBitrate, formatDuration, readMediaInfo } from './logic';

const fixture = (name: string) => new Blob([readFileSync(fileURLToPath(new URL(`../../../../../../apps/web/e2e/fixtures/${name}`, import.meta.url)))]);

describe('readMediaInfo', () => {
  it('describes a WAV file', async () => {
    const info = await readMediaInfo(fixture('media-tone.wav'));
    expect(info.format).toMatch(/wav/i);
    expect(info.durationSec).toBeCloseTo(1, 2);
    expect(info.tracks).toHaveLength(1);
    const t = info.tracks[0]!;
    expect(t.kind).toBe('audio');
    expect(t.codec).toBe('pcm-s16');
    expect(t.channels).toBe(1);
    expect(t.sampleRate).toBe(8000);
    expect(info.overallBitrate).toBeGreaterThan(120_000);
  });

  it('reads MP3 tags and the audio track', async () => {
    const info = await readMediaInfo(fixture('media-tagged.mp3'));
    expect(info.format).toMatch(/mp3/i);
    const tags = Object.fromEntries(info.tags);
    expect(tags.Title).toBe('Fixture Song');
    expect(tags.Artist).toBe('Test Artist');
    expect(tags.Album).toBe('Test Album');
    const t = info.tracks[0]!;
    expect(t.codec).toBe('mp3');
    expect(t.channels).toBe(2);
    expect(t.sampleRate).toBe(44100);
    expect(info.durationSec).toBeGreaterThan(0.4);
  });

  it('rejects non-media input with a plain message', async () => {
    await expect(readMediaInfo(new Blob(['this is just some text, definitely not media'.repeat(20)]))).rejects.toThrow(ToolError);
    await expect(readMediaInfo(new Blob([]))).rejects.toThrow('empty');
  });

  it('rejects a truncated container', async () => {
    const wav = fixture('media-tone.wav');
    // Keep the RIFF header but cut it mid-way: still readable, but must not crash or hang.
    const info = await readMediaInfo(wav.slice(0, 2000)).catch((e) => e);
    expect(info instanceof ToolError || (info && typeof info === 'object' && 'format' in info)).toBe(true);
  });
});

describe('formatters', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0:00.000');
    expect(formatDuration(61.5)).toBe('1:01.500');
    expect(formatDuration(3723.004)).toBe('1:02:03.004');
    expect(formatDuration(null)).toBe('unknown');
    expect(formatDuration(Number.NaN)).toBe('unknown');
  });
  it('formats bitrates', () => {
    expect(formatBitrate(128_000)).toBe('128 kbps');
    expect(formatBitrate(2_500_000)).toBe('2.50 Mbps');
    expect(formatBitrate(null)).toBe('unknown');
    expect(formatBitrate(0)).toBe('unknown');
  });
  it('labels codecs and channels', () => {
    expect(codecLabel('avc')).toBe('H.264 / AVC');
    expect(codecLabel('pcm-s16')).toBe('PCM (s16)');
    expect(codecLabel(null)).toBe('unknown');
    expect(channelLabel(2)).toBe('2 (stereo)');
    expect(channelLabel(3)).toBe('3');
  });
});
