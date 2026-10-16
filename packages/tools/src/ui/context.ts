import { createContext, useContext } from 'react';
import type { ToolMeta } from '../core/types';

/** The host provides the current Tool's metadata to shared components (Send to…, samples). */
export const ToolMetaContext = createContext<ToolMeta | null>(null);

export function useToolMeta(): ToolMeta | null {
  return useContext(ToolMetaContext);
}
