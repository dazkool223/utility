import { useEffect, useMemo } from 'react';
import { wrap, type Remote } from 'comlink';
import { ToolError } from '../core/types';

/** A call was cancelled (restart) or ran past its timeout. The worker and anything it held in memory are gone. */
export class WorkerStopped extends ToolError {}

export interface UseWorkerOptions {
  /**
   * Stop any call that runs longer than this. The worker is terminated (it cannot be interrupted any other way) and
   * the next call starts a fresh one, so state kept inside the worker is lost. Leave unset for long jobs such as media.
   */
  timeoutMs?: number;
}

/** The accessor returned by `useWorker`. `restart()` terminates the worker; the next call starts a new one. */
export type WorkerAccessor<T> = (() => Remote<T>) & { restart(): void };

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
export function useWorker<T>(create: () => Worker, options: UseWorkerOptions = {}): WorkerAccessor<T> {
  const { timeoutMs } = options;
  const handle = useMemo(() => {
    let worker: Worker | null = null;
    let remote: Remote<T> | null = null;
    // Calls waiting on the current worker; rejected when it is terminated so nothing waits forever.
    const pending = new Set<(e: Error) => void>();

    const dispose = () => {
      worker?.terminate();
      worker = null;
      remote = null;
    };
    const restart = () => {
      dispose();
      const stopped = new WorkerStopped('Stopped.');
      for (const reject of [...pending]) reject(stopped);
      pending.clear();
    };
    const current = (): Remote<T> => {
      if (!remote) {
        worker = create();
        remote = wrap<T>(worker);
      }
      return remote;
    };

    const guarded = (): Remote<T> =>
      new Proxy({} as Remote<T>, {
        get(_, prop) {
          if (prop === 'then') return undefined; // never look like a promise
          return (...args: unknown[]) =>
            new Promise((resolve, reject) => {
              const timer =
                timeoutMs === undefined
                  ? undefined
                  : setTimeout(() => {
                      fail(new WorkerStopped(`This took longer than ${Math.round(timeoutMs / 1000)} seconds, so it was stopped. Try something smaller.`));
                      restart();
                    }, timeoutMs);
              const fail = (e: Error) => {
                clearTimeout(timer);
                pending.delete(fail);
                reject(e);
              };
              pending.add(fail);
              const call = (current() as unknown as Record<string | symbol, (...a: unknown[]) => Promise<unknown>>)[prop]!;
              call(...args).then(
                (v) => {
                  clearTimeout(timer);
                  pending.delete(fail);
                  resolve(v);
                },
                (e: unknown) => {
                  clearTimeout(timer);
                  pending.delete(fail);
                  reject(e);
                },
              );
            });
        },
      });

    const get = (() => guarded()) as WorkerAccessor<T>;
    get.restart = restart;
    return { get, dispose };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one worker per mounted Tool
  }, []);
  useEffect(() => () => handle.dispose(), [handle]);
  return handle.get;
}
