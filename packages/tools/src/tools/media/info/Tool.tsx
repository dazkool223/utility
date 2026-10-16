import { useEffect, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { BusyLine, ErrorBox, FileDrop, FileList, KeyValueTable, PaneTitle } from '@/ui';
import { channelLabel, codecLabel, formatBitrate, formatDuration, readMediaInfo, type MediaInfo, type TrackInfo } from './logic';

function trackRows(t: TrackInfo): Array<[string, string]> {
  const rows: Array<[string, string]> = [['Codec', codecLabel(t.codec)]];
  if (t.codecString) rows.push(['Codec string', t.codecString]);
  if (t.kind === 'video') {
    if (t.width && t.height) rows.push(['Size', `${t.width} × ${t.height}`]);
    if (t.frameRate) rows.push(['Frame rate', `${t.frameRate} fps`]);
    if (t.rotation) rows.push(['Rotation', `${t.rotation}°`]);
    if (t.hdr) rows.push(['Dynamic range', 'HDR']);
  }
  if (t.kind === 'audio') {
    if (t.channels) rows.push(['Channels', channelLabel(t.channels)]);
    if (t.sampleRate) rows.push(['Sample rate', `${t.sampleRate.toLocaleString()} Hz`]);
  }
  rows.push(['Bitrate', formatBitrate(t.bitrate)]);
  if (t.language) rows.push(['Language', t.language]);
  if (t.name) rows.push(['Name', t.name]);
  if (t.decodable !== null) rows.push(['Plays in this browser', t.decodable ? 'Yes' : 'No']);
  return rows;
}

export default function MediaInfoTool({ initialFiles }: ToolProps) {
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverUrls, setCoverUrls] = useState<string[]>([]);

  useEffect(() => {
    setInfo(null);
    setError(null);
    if (!file) return;
    let cancelled = false;
    setBusy(true);
    readMediaInfo(file).then(
      (r) => {
        if (!cancelled) setInfo(r);
      },
      (e: unknown) => {
        if (!cancelled) setError(e instanceof ToolError ? e.message : 'The file could not be read.');
      },
    ).finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const urls = (info?.covers ?? []).map((c) => URL.createObjectURL(new Blob([c.data as BlobPart], { type: c.mimeType })));
    setCoverUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [info]);

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="media" accept="audio/*,video/*,.mkv,.mka,.flac,.aac,.m4a,.opus,.ogg,.mov" onFiles={(f) => setFile(f[0] ?? null)} label="Drop an audio or video file here" />
      ) : (
        <FileList files={[file]} onRemove={() => setFile(null)} />
      )}
      <ErrorBox error={error} />
      <BusyLine busy={busy} label="Reading file details (loading the media engine on first use)…" />
      {info && (
        <div className="flex flex-col gap-4" data-testid="tool-output">
          <section className="flex flex-col gap-2">
            <PaneTitle>File</PaneTitle>
            <KeyValueTable
              testId="media-file"
              rows={[
                ['Container', info.format],
                ['MIME type', info.mimeType],
                ['Duration', formatDuration(info.durationSec)],
                ['Size', formatBytes(info.size)],
                ['Overall bitrate', formatBitrate(info.overallBitrate)],
                ['Tracks', String(info.tracks.length)],
              ]}
            />
          </section>
          {info.tracks.map((t, i) => (
            <section key={i} className="flex flex-col gap-2">
              <PaneTitle>
                {t.kind === 'video' ? 'Video' : t.kind === 'audio' ? 'Audio' : 'Other'} track {t.number}
              </PaneTitle>
              <KeyValueTable testId={`media-track-${i}`} rows={trackRows(t)} />
            </section>
          ))}
          {info.tags.length > 0 && (
            <section className="flex flex-col gap-2">
              <PaneTitle>Tags</PaneTitle>
              <KeyValueTable testId="media-tags" rows={info.tags} />
            </section>
          )}
          {info.covers.length > 0 && (
            <section className="flex flex-col gap-2">
              <PaneTitle>Embedded images</PaneTitle>
              <div className="flex flex-wrap gap-3">
                {info.covers.map((c, i) => (
                  <figure key={i} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    {coverUrls[i] && <img src={coverUrls[i]} alt={`Embedded ${c.kind} image`} className="max-h-48 rounded border" />}
                    <figcaption>
                      {c.kind} · {c.mimeType} · {formatBytes(c.bytes)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
