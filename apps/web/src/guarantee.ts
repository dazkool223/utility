import { useSyncExternalStore } from 'react';

/**
 * Whether the Offline Guarantee currently has a real problem the user should know about (for example a Heavy Tool
 * engine that has not been cached yet). `null` is the calm, normal state. Only the privacy chip reads this.
 */
let problem: string | null = null;
const listeners = new Set<() => void>();

export function setGuaranteeProblem(next: string | null) {
  if (next === problem) return;
  problem = next;
  for (const l of listeners) l();
}

export function useGuaranteeProblem(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => problem,
  );
}

// Heavy Tools whose engine is fetched from our own origin on first use, then kept in the runtime cache (see vite.config.ts).
// Other Heavy Tools ship their engine in the precached app, so being offline is never a problem for them.
const ENGINE_PREFIX: Record<string, string> = { 'pdf/ocr': '/engines/ocr/' };

/** True when `toolPath`'s engine is cached, or needs no separate cache. */
export async function engineAvailableOffline(toolPath: string): Promise<boolean> {
  const prefix = ENGINE_PREFIX[toolPath];
  if (!prefix || typeof caches === 'undefined') return true;
  try {
    const keys = await (await caches.open('heavy-tool-engines')).keys();
    return keys.some((r) => new URL(r.url).pathname.startsWith(prefix));
  } catch {
    return true;
  }
}
