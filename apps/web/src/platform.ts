export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

/** Label for the platform modifier key. */
export const MOD = isMac ? '⌘' : 'Ctrl';
