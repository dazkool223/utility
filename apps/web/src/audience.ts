import { setDeveloperTools, showsDeveloperTools } from '@/core/preferences';
import { usePreferences } from './theme';
import { useSurface } from './surface';

/** The "Developer tools" switch: off by default on the Website, on in the Extension; a stored choice wins. */
export function useDeveloperTools(): [boolean, (on: boolean) => void] {
  const prefs = usePreferences();
  const { surface } = useSurface();
  return [showsDeveloperTools(prefs, surface === 'extension'), setDeveloperTools];
}
