import { useEffect, useMemo } from 'react';
import { wrap, type Remote } from 'comlink';

/**
 * Use a Comlink-exposed Web Worker from a Tool component. The worker is created lazily
 * on first call and terminated on unmount.
 *
 *   const api = useWorker<typeof import('./worker').api>(
 *     () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
 *   );
 *   const result = await api().format(input);
 *
 * The `new Worker(new URL(...), { type: 'module' })` expression must be written literally in the
 * Tool's own file so Vite can bundle the worker.
 */
export function useWorker<T>(create: () => Worker): () => Remote<T> {
  const handle = useMemo(() => {
    let worker: Worker | null = null;
    let remote: Remote<T> | null = null;
    return {
      get(): Remote<T> {
        if (!remote) {
          worker = create();
          remote = wrap<T>(worker);
        }
        return remote;
      },
      dispose() {
        worker?.terminate();
        worker = null;
        remote = null;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one worker per mounted Tool
  }, []);
  useEffect(() => () => handle.dispose(), [handle]);
  return handle.get;
}
