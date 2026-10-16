// Runs before the app renders so the page never flashes the wrong theme.
import { applyTheme } from './theme';
import { getPreferences } from '@/core/preferences';

applyTheme(getPreferences().theme);
