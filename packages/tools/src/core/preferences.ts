/**
 * Preferences: the only state kept on the device (settings, Favourite Tools, Recent Tools).
 * Tool Input and Tool Output must never be written here.
 */

export type Theme = 'system' | 'light' | 'dark';

export interface Preferences {
  theme: Theme;
  /** The "Developer tools" switch. Absent until the user chooses; the default depends on the Surface. */
  developerTools?: boolean;
  favourites: string[];
  recent: string[];
}

const KEY = 'utility:preferences:v1';
const MAX_RECENT = 8;
const DEFAULTS: Preferences = { theme: 'dark', favourites: [], recent: [] };

type Listener = (prefs: Preferences) => void;
const listeners = new Set<Listener>();
let cache: Preferences | null = null;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage disabled (e.g. some private modes)
  }
}

export function getPreferences(): Preferences {
  if (cache) return cache;
  try {
    const raw = storage()?.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
    cache = {
      theme: parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : DEFAULTS.theme,
      ...(typeof parsed.developerTools === 'boolean' ? { developerTools: parsed.developerTools } : {}),
      favourites: Array.isArray(parsed.favourites) ? parsed.favourites.filter((x) => typeof x === 'string') : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : [],
    };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function save(next: Preferences) {
  cache = next;
  try {
    storage()?.setItem(KEY, JSON.stringify(next));
  } catch {
    // quota or disabled storage: keep in memory only
  }
  for (const l of listeners) l(next);
}

export function subscribePreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  save({ ...getPreferences(), theme });
}

/** Whether browsing shows developer Tools: a stored choice always wins over the Surface's default. */
export function showsDeveloperTools(prefs: Preferences, defaultOn: boolean): boolean {
  return prefs.developerTools ?? defaultOn;
}

export function setDeveloperTools(on: boolean) {
  save({ ...getPreferences(), developerTools: on });
}

export function toggleFavourite(toolId: string) {
  const p = getPreferences();
  const favourites = p.favourites.includes(toolId) ? p.favourites.filter((id) => id !== toolId) : [...p.favourites, toolId];
  save({ ...p, favourites });
}

export function recordRecent(toolId: string) {
  const p = getPreferences();
  save({ ...p, recent: [toolId, ...p.recent.filter((id) => id !== toolId)].slice(0, MAX_RECENT) });
}

/** "Clear all local data". */
export function clearPreferences() {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
  cache = null;
  save({ ...DEFAULTS });
}
