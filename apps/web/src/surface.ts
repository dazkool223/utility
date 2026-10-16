import { createContext, useContext } from 'react';

/** Which Surface the shell is running in (see CONTEXT.md). */
export interface SurfaceConfig {
  surface: 'website' | 'extension';
  /** Public Website origin, used by the Extension to link out to Heavy Tools. */
  websiteUrl: string;
}

export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL ?? 'https://utility.example';

export const SurfaceContext = createContext<SurfaceConfig>({ surface: 'website', websiteUrl: WEBSITE_URL });

export function useSurface(): SurfaceConfig {
  return useContext(SurfaceContext);
}
