import { ToolError } from '@/core/types';

export interface TrackInfo {
  kind: 'video' | 'audio' | 'other';
  number: number;
  codec: string | null;
  /** RFC 6381 style codec string such as avc1.64001f, when the container has one. */
  codecString: string | null;
  language: string | null;
  name: string | null;
  bitrate: number | null;
  width?: number;
  height?: number;
  rotation?: number;
  frameRate?: number;
  hdr?: boolean;
  channels?: number;
  sampleRate?: number;
  /** Can this browser decode the track (WebCodecs)? */
  decodable: boolean | null;
}

export interface CoverInfo {
  mimeType: string;
  bytes: number;
  kind: string;
  data: Uint8Array;
}

export interface MediaInfo {
  format: string;
  mimeType: string;
  durationSec: number | null;
  size: number;
  /** Whole-file average bitrate in bits per second. */
  overallBitrate: number | null;
  tracks: TrackInfo[];
  tags: Array<[string, string]>;
  covers: CoverInfo[];
}

export function formatDuration(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec)) return 'unknown';
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const frac = String(ms % 1000).padStart(3, '0');
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}.${frac}`;
}

export function formatBitrate(bps: number | null): string {
  if (bps === null || !Number.isFinite(bps) || bps <= 0) return 'unknown';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

export function channelLabel(n: number): string {
  const names: Record<number, string> = { 1: 'mono', 2: 'stereo', 4: 'quad', 6: '5.1 surround', 8: '7.1 surround' };
  return names[n] ? `${n} (${names[n]})` : String(n);
}

const CODEC_NAMES: Record<string, string> = {
  avc: 'H.264 / AVC',
  hevc: 'H.265 / HEVC',
  vp8: 'VP8',
  vp9: 'VP9',
  av1: 'AV1',
  prores: 'Apple ProRes',
  aac: 'AAC',
  opus: 'Opus',
  mp3: 'MP3',
  vorbis: 'Vorbis',
  flac: 'FLAC',
  ac3: 'Dolby Digital (AC-3)',
  eac3: 'Dolby Digital Plus (E-AC-3)',
  dts: 'DTS',
  ulaw: 'G.711 µ-law',
  alaw: 'G.711 A-law',
};

export function codecLabel(codec: string | null): string {
  if (!codec) return 'unknown';
  if (CODEC_NAMES[codec]) return CODEC_NAMES[codec]!;
  if (codec.startsWith('pcm-')) return `PCM (${codec.slice(4)})`;
  return codec;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/** Reads container, tracks and tags from an audio or video file without decoding it. */
export async function readMediaInfo(file: Blob): Promise<MediaInfo> {
  if (file.size === 0) throw new ToolError('The file is empty.');
  const { Input, BlobSource, ALL_FORMATS } = await import('mediabunny');
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    let format;
    try {
      format = await input.getFormat();
    } catch (e) {
      if (e instanceof Error && e.name === 'UnsupportedInputFormatError') {
        throw new ToolError('This does not look like an audio or video file this Tool can read (MP4, MOV, WebM, MKV, MP3, WAV, OGG, FLAC, AAC).');
      }
      throw new ToolError('The file could not be read. It may be damaged or truncated.');
    }

    const duration = (await safe(() => input.getDurationFromMetadata())) ?? (await safe(() => input.computeDuration()));
    const rawTracks = await safe(() => input.getTracks());
    if (!rawTracks) throw new ToolError('The tracks in this file could not be read. It may be damaged or truncated.');

    const tracks: TrackInfo[] = [];
    for (const t of rawTracks) {
      const base = {
        number: t.number,
        codec: await safe(async () => t.getCodec()),
        codecString: await safe(() => t.getCodecParameterString()),
        language: await safe(async () => t.getLanguageCode()).then((l) => (l && l !== 'und' ? l : null)),
        name: await safe(() => t.getName()),
        bitrate: (await safe(() => t.getBitrate())) ?? (await safe(() => t.getAverageBitrate())),
        decodable: await safe(() => t.canDecode()),
      };
      if (t.isVideoTrack()) {
        const fps = await safe(() => t.computeFrameRateMetrics());
        tracks.push({
          kind: 'video',
          ...base,
          width: await safe(() => t.getDisplayWidth()).then((v) => v ?? undefined),
          height: await safe(() => t.getDisplayHeight()).then((v) => v ?? undefined),
          rotation: await safe(() => t.getRotation()).then((v) => v ?? undefined),
          frameRate: fps ? Math.round(fps.bestGuessFrameRate * 1000) / 1000 : undefined,
          hdr: (await safe(() => t.hasHighDynamicRange())) ?? undefined,
        });
      } else if (t.isAudioTrack()) {
        tracks.push({
          kind: 'audio',
          ...base,
          channels: await safe(() => t.getNumberOfChannels()).then((v) => v ?? undefined),
          sampleRate: await safe(() => t.getSampleRate()).then((v) => v ?? undefined),
        });
      } else {
        tracks.push({ kind: 'other', ...base });
      }
    }

    const metadata = await safe(() => input.getMetadataTags());
    const tags: Array<[string, string]> = [];
    const covers: CoverInfo[] = [];
    if (metadata) {
      const add = (k: string, v: unknown) => {
        if (v === undefined || v === null || v === '') return;
        tags.push([k, v instanceof Date ? v.toISOString().slice(0, 10) : String(v)]);
      };
      add('Title', metadata.title);
      add('Artist', metadata.artist);
      add('Album', metadata.album);
      add('Album artist', metadata.albumArtist);
      if (metadata.trackNumber !== undefined) add('Track', metadata.tracksTotal ? `${metadata.trackNumber} / ${metadata.tracksTotal}` : metadata.trackNumber);
      if (metadata.discNumber !== undefined) add('Disc', metadata.discsTotal ? `${metadata.discNumber} / ${metadata.discsTotal}` : metadata.discNumber);
      add('Genre', metadata.genre);
      add('Date', metadata.date);
      add('BPM', metadata.beatsPerMinute);
      add('Description', metadata.description);
      add('Comment', metadata.comment);
      add('Lyrics', metadata.lyrics ? String(metadata.lyrics).slice(0, 300) : undefined);
      const known = new Set(tags.map(([k]) => k));
      for (const [key, value] of Object.entries(metadata.raw ?? {}).slice(0, 60)) {
        if (typeof value === 'string' && value && !known.has(key)) tags.push([key, value.length > 300 ? `${value.slice(0, 300)}…` : value]);
        else if (Array.isArray(value) && value.length && value.every((v) => typeof v === 'string')) tags.push([key, (value as string[]).join(', ')]);
      }
      for (const img of metadata.images ?? []) covers.push({ mimeType: img.mimeType, bytes: img.data.length, kind: img.kind, data: img.data });
    }

    return {
      format: format.name,
      mimeType: (await safe(() => input.getMimeType())) ?? format.mimeType,
      durationSec: duration,
      size: file.size,
      overallBitrate: duration && duration > 0 ? Math.round((file.size * 8) / duration) : null,
      tracks,
      tags,
      covers,
    };
  } finally {
    input.dispose();
  }
}
