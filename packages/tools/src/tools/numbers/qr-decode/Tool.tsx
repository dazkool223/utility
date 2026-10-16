import { useCallback, useEffect, useRef, useState } from 'react';
import { transfer } from 'comlink';
import type { ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, FileDrop, KeyValueTable, PaneTitle, useWorker } from '@/ui';
import type { QrRead } from './logic';

const MAX_SIDE = 2000;

async function toPixels(source: CanvasImageSource, w: number, h: number, max: number): Promise<{ data: ArrayBuffer; w: number; h: number }> {
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, cw, ch);
  const img = ctx.getImageData(0, 0, cw, ch);
  return { data: img.data.buffer as ArrayBuffer, w: cw, h: ch };
}

export default function QrDecodeTool({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [result, setResult] = useState<QrRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState('');
  const [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const decodeFile = useCallback(
    async (file: File) => {
      setError(null);
      setResult(null);
      try {
        const bmp = await createImageBitmap(file);
        const url = URL.createObjectURL(file);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        // Try the full-size image first, then a smaller copy, which helps with very large photos.
        for (const max of [MAX_SIDE, 1000, 500]) {
          const px = await toPixels(bmp, bmp.width, bmp.height, max);
          const r = await api().decode(transfer(px.data, [px.data]), px.w, px.h);
          if (r) {
            setResult(r);
            bmp.close();
            return;
          }
        }
        bmp.close();
        setError('No QR code was found in this image. Try a sharper, larger or better-lit picture, and make sure the whole code (with its white border) is visible.');
      } catch (e) {
        setError(e instanceof Error && e.name !== 'InvalidStateError' ? e.message : 'This file could not be read as an image.');
      }
    },
    [api],
  );

  useEffect(() => {
    if (initialFiles?.[0]) void decodeFile(initialFiles[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setError(null);
    setResult(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setCamera(true);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setError(name === 'NotAllowedError' ? 'Camera access was blocked. Allow the camera for this site in your browser settings, or use an image file.' : name === 'NotFoundError' ? 'No camera was found on this device.' : 'The camera could not be started.');
    }
  }

  useEffect(() => {
    if (!camera || !video.current || !stream.current) return;
    const v = video.current;
    v.srcObject = stream.current;
    void v.play().catch(() => undefined);
    let busy = false;
    const timer = setInterval(async () => {
      if (busy || v.readyState < 2 || !v.videoWidth) return;
      busy = true;
      try {
        const px = await toPixels(v, v.videoWidth, v.videoHeight, 800);
        const r = await api().decode(transfer(px.data, [px.data]), px.w, px.h);
        if (r) {
          setResult(r);
          stopCamera();
        }
      } finally {
        busy = false;
      }
    }, 250);
    return () => clearInterval(timer);
  }, [camera, api, stopCamera]);

  const cameraAvailable = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="flex flex-col gap-3">
      <FileDrop kind="image" accept="image/*" onFiles={(f) => f[0] && void decodeFile(f[0])} label="Drop an image containing a QR code" />
      <div className="flex flex-wrap items-center gap-2">
        {camera ? (
          <Button onClick={stopCamera}>Stop camera</Button>
        ) : (
          <Button onClick={() => void startCamera()} disabled={!cameraAvailable} title={cameraAvailable ? undefined : 'No camera available in this browser'}>
            Scan with camera
          </Button>
        )}
      </div>
      {camera && <video ref={video} muted playsInline className="max-h-80 w-fit max-w-full rounded-lg border bg-muted" aria-label="Camera preview" />}
      <ErrorBox error={error} />
      <div className="grid gap-3 lg:grid-cols-2">
        {preview && <img src={preview} alt="Uploaded image" className="max-h-80 w-fit max-w-full rounded-lg border" />}
        {result && (
          <section className="flex min-w-0 flex-col gap-2">
            <div className="flex min-h-8 items-center gap-2">
              <PaneTitle>Decoded</PaneTitle>
              <span className="flex-1" />
              <CopyButton primary text={result.text} />
            </div>
            <KeyValueTable testId="qr-info" rows={[['Type', result.kind], ['Length', `${result.text.length} characters`]]} />
            <CodeEditor value={result.text} readOnly label="Tool output" testId="tool-output" className="!h-40 !min-h-0" />
          </section>
        )}
      </div>
    </div>
  );
}
