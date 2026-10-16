import { ToolError } from '@/core/types';

export type AudioFormatId = 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a';
export type ChannelMode = 'keep' | 'mono' | 'stereo';

export interface AudioFormatSpec {
  id: AudioFormatId;
  label: string;
  extension: string;
  mimeType: string;
  /** Mediabunny audio codec used for the output. */
  codec: 'pcm-s16' | 'mp3' | 'flac' | 'opus' | 'aac';
  /** Bitrate is meaningful (lossy codec). */
  lossy: boolean;
}

export const AUDIO_FORMATS: Record<AudioFormatId, AudioFormatSpec> = {
  wav: { id: 'wav', label: 'WAV (uncompressed)', extension: 'wav', mimeType: 'audio/wav', codec: 'pcm-s16', lossy: false },
  mp3: { id: 'mp3', label: 'MP3', extension: 'mp3', mimeType: 'audio/mpeg', codec: 'mp3', lossy: true },
  flac: { id: 'flac', label: 'FLAC (lossless)', extension: 'flac', mimeType: 'audio/flac', codec: 'flac', lossy: false },
  ogg: { id: 'ogg', label: 'Ogg (Opus)', extension: 'ogg', mimeType: 'audio/ogg', codec: 'opus', lossy: true },
  m4a: { id: 'm4a', label: 'M4A (AAC)', extension: 'm4a', mimeType: 'audio/mp4', codec: 'aac', lossy: true },
};

export interface AudioConvertOptions {
  format: AudioFormatId;
  /** Kilobits per second for lossy formats. */
  bitrateKbps: number;
  /** Seconds. */
  trimStart: number;
  /** Seconds; null means "to the end". */
  trimEnd: number | null;
  /** Hz; null keeps the source rate. */
  sampleRate: number | null;
  channels: ChannelMode;
  keepTags: boolean;
}

export const DEFAULT_AUDIO_OPTIONS: AudioConvertOptions = {
  format: 'mp3',
  bitrateKbps: 192,
  trimStart: 0,
  trimEnd: null,
  sampleRate: null,
  channels: 'keep',
  keepTags: true,
};

/** Checks the trim range against the source duration. Throws a ToolError with a plain message. */
export function validateTrim(start: number, end: number | null, duration: number | null): void {
  if (!Number.isFinite(start) || start < 0) throw new ToolError('The trim start must be 0 or more seconds.');
  if (end !== null) {
    if (!Number.isFinite(end)) throw new ToolError('The trim end must be a number of seconds.');
    if (end <= start) throw new ToolError('The trim end must be after the trim start.');
  }
  if (duration !== null && start >= duration) throw new ToolError(`The trim start (${start}s) is at or after the end of the audio (${duration.toFixed(2)}s).`);
}

/** `song.flac` + mp3 → `song.mp3`; adds `-trimmed` when a range was cut. */
export function outputFileName(inputName: string, format: AudioFormatId, trimmed: boolean): string {
  const stem = inputName.replace(/\.[^./\\]+$/, '') || 'audio';
  return `${stem}${trimmed ? '-trimmed' : ''}.${AUDIO_FORMATS[format].extension}`;
}

/** Parses "90", "1:30", "1:02:03.5" into seconds. Returns null for blank input and NaN for garbage. */
export function parseTime(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return Number.NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

/** Which output formats this browser can produce. WAV, MP3 and FLAC always work (software encoders). */
export async function availableFormats(): Promise<AudioFormatId[]> {
  const { canEncodeAudio } = await import('mediabunny');
  const out: AudioFormatId[] = ['mp3', 'wav', 'flac'];
  if (await canEncodeAudio('opus').catch(() => false)) out.push('ogg');
  if (await canEncodeAudio('aac').catch(() => false)) out.push('m4a');
  return out;
}

export interface AudioConvertResult {
  blob: Blob;
  name: string;
  durationSec: number | null;
}

function explainDiscard(reason: string, codec: string | null): string {
  switch (reason) {
    case 'undecodable_source_codec':
    case 'unknown_source_codec':
      return `This browser cannot decode the audio in this file${codec ? ` (${codec})` : ''}.`;
    case 'no_encodable_target_codec':
      return 'This browser cannot encode the chosen output format. Pick another format.';
    default:
      return 'The audio track could not be converted.';
  }
}

/** Converts (and optionally trims) the audio of `file`. Decoding uses the browser's WebCodecs; MP3 and FLAC encoders are WebAssembly. */
export async function convertAudio(file: Blob, name: string, options: AudioConvertOptions, onProgress?: (fraction: number) => void): Promise<AudioConvertResult> {
  const spec = AUDIO_FORMATS[options.format];
  const mb = await import('mediabunny');
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  try {
    let audioTrack;
    try {
      audioTrack = await input.getPrimaryAudioTrack();
    } catch (e) {
      if (e instanceof Error && e.name === 'UnsupportedInputFormatError') throw new ToolError('This does not look like an audio or video file this Tool can read.');
      throw new ToolError('The file could not be read. It may be damaged or truncated.');
    }
    if (!audioTrack) throw new ToolError('This file has no audio track.');
    const duration = await input.computeDuration().catch(() => null);
    validateTrim(options.trimStart, options.trimEnd, duration);

    if (spec.codec === 'mp3' && !(await mb.canEncodeAudio('mp3'))) (await import('@mediabunny/mp3-encoder')).registerMp3Encoder();
    if (spec.codec === 'flac' && !(await mb.canEncodeAudio('flac'))) (await import('@mediabunny/flac-encoder')).registerFlacEncoder();
    if (!(await mb.canEncodeAudio(spec.codec))) throw new ToolError(`This browser cannot encode ${spec.label}. Pick another format.`);

    const format =
      spec.id === 'wav' ? new mb.WavOutputFormat() : spec.id === 'mp3' ? new mb.Mp3OutputFormat() : spec.id === 'flac' ? new mb.FlacOutputFormat() : spec.id === 'ogg' ? new mb.OggOutputFormat() : new mb.Mp4OutputFormat();
    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const conversion = await mb.Conversion.init({
      input,
      output,
      video: { discard: true },
      audio: {
        codec: spec.codec,
        ...(spec.lossy ? { bitrate: options.bitrateKbps * 1000 } : {}),
        ...(options.sampleRate ? { sampleRate: options.sampleRate } : {}),
        ...(options.channels !== 'keep' ? { numberOfChannels: options.channels === 'mono' ? 1 : 2 } : {}),
      },
      trim: options.trimStart > 0 || options.trimEnd !== null ? { start: options.trimStart, ...(options.trimEnd !== null ? { end: options.trimEnd } : {}) } : undefined,
      tags: options.keepTags ? undefined : {},
      showWarnings: false,
    });
    if (!conversion.isValid) {
      const reason = conversion.discardedTracks.find((d) => d.track === audioTrack)?.reason ?? conversion.discardedTracks[0]?.reason ?? 'cannot_copy';
      throw new ToolError(explainDiscard(reason, audioTrack.codec));
    }
    if (onProgress) conversion.onProgress = (p) => onProgress(p);
    try {
      await conversion.execute();
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(`The conversion failed: ${e instanceof Error ? e.message : 'unknown error'}.`);
    }
    const buffer = output.target.buffer;
    if (!buffer || buffer.byteLength === 0) throw new ToolError('The conversion produced no audio. Check the trim range.');
    const trimmed = options.trimStart > 0 || options.trimEnd !== null;
    const end = options.trimEnd !== null && duration !== null ? Math.min(options.trimEnd, duration) : duration;
    return {
      blob: new Blob([buffer], { type: spec.mimeType }),
      name: outputFileName(name, options.format, trimmed),
      durationSec: end === null ? null : Math.max(0, end - options.trimStart),
    };
  } finally {
    input.dispose();
  }
}
