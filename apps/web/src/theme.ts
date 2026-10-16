import { useSyncExternalStore } from 'react';
import { getPreferences, subscribePreferences, type Preferences, type Theme } from '@/core/preferences';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? (darkQuery().matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
}

if (typeof window !== 'undefined') {
  darkQuery().addEventListener('change', () => applyTheme(getPreferences().theme));
  subscribePreferences((p) => applyTheme(p.theme));
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribePreferences, getPreferences);
}
