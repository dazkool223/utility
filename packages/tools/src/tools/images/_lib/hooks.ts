import { useEffect, useRef, useState } from 'react';
import { transfer } from 'comlink';
import { SUPPORTED_IMAGE_PIXELS } from '@/core/limits';
import type { ImageInfo } from './session';

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** A blob URL that is revoked when the blob changes or the component unmounts. */
export function useObjectUrl(data: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!data) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [data]);
  return url;
}

export interface SessionState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  info: ImageInfo | null;
  error: string | null;
  /** Over the Supported Size in pixels (spec §5). */
  large: boolean;
  /** Loaded, and either small enough or the user chose to continue anyway. */
  ready: boolean;
  confirm: () => void;
}

/** Load a chosen file into the Tool's worker and report its size so the page can gate on the pixel limit. */
export function useImageSession(file: File | null, api: () => { load: (buf: ArrayBuffer) => Promise<ImageInfo> }): SessionState {
  const [state, setState] = useState<{ status: SessionState['status']; info: ImageInfo | null; error: string | null }>({ status: 'idle', info: null, error: null });
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(false);
    if (!file) {
      setState({ status: 'idle', info: null, error: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading', info: null, error: null });
    file
      .arrayBuffer()
      .then((buf) => api().load(transfer(buf, [buf])))
      .then(
        (info) => !cancelled && setState({ status: 'ready', info, error: null }),
        (e: unknown) => !cancelled && setState({ status: 'error', info: null, error: errorMessage(e) }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `api` is stable for the life of the Tool
  }, [file]);

  const large = !!state.info && state.info.width * state.info.height > SUPPORTED_IMAGE_PIXELS;
  return { ...state, large, ready: state.status === 'ready' && (!large || confirmed), confirm: () => setConfirmed(true) };
}

/**
 * Run `run` shortly after any of `deps` change (pass `null` to stay idle). Older runs that finish late are
 * ignored, so dragging a slider never shows a stale result.
 */
export function useJob<T>(run: (() => Promise<T>) | null, deps: readonly unknown[], delay = 250): { result: T | null; busy: boolean; error: string | null } {
  const [state, setState] = useState<{ result: T | null; busy: boolean; error: string | null }>({ result: null, busy: false, error: null });
  const latest = useRef(run);
  latest.current = run;

  useEffect(() => {
    if (!latest.current) {
      setState({ result: null, busy: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, busy: true, error: null }));
    const timer = setTimeout(() => {
      const job = latest.current;
      if (!job) return;
      job().then(
        (result) => !cancelled && setState({ result, busy: false, error: null }),
        (e: unknown) => !cancelled && setState({ result: null, busy: false, error: errorMessage(e) }),
      );
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists exactly what should retrigger the job
  }, [run === null, delay, ...deps]);

  return state;
}
