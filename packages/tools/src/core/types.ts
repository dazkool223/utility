import type { ComponentType } from 'react';
import type { DetectKind } from './detect';

export type CategoryId =
  | 'json'
  | 'formats'
  | 'encoders'
  | 'crypto'
  | 'text'
  | 'time'
  | 'web'
  | 'network'
  | 'code'
  | 'numbers'
  | 'images'
  | 'pdf'
  | 'office'
  | 'media'
  | 'archives'
  | 'binary';

export type Priority = 'P0' | 'P1' | 'P2';

/** Which Supported Size applies to this Tool's Tool Input (spec §5). */
export type InputKind = 'text' | 'image' | 'pdf' | 'media' | 'binary' | 'none';

/** A known limitation shown before the user starts. The user may still proceed. */
export interface Restriction {
  message: string;
  /** Only shown when this returns true (e.g. a missing browser feature). Omit to always show. */
  applies?: () => boolean;
}

/** Example used by the generic end-to-end test: typing `input` must produce output containing `expect`. */
export interface ToolExample {
  input: string;
  expect: string;
}

/** A text → text operation a Tool offers to the Pipeline (chaining Tools). */
export interface PipelineStep {
  /** Unique across all Tools, e.g. `json-format:pretty`. */
  id: string;
  /** Shown in the Pipeline, e.g. "JSON: format (2 spaces)". */
  label: string;
  run: (input: string) => string | Promise<string>;
}

export interface ToolProps {
  /** Tool Input handed over by Send to…, Smart Paste or the Extension context menu. */
  initialInput?: string;
  /** Files handed over by Smart Paste (a file dropped on the home page). File Tools should accept these. */
  initialFiles?: File[];
}

export interface ToolMeta {
  /** Stable kebab-case id, unique across all Tools, e.g. `json-format`. */
  id: string;
  /** URL path without leading slash, `<category>/<slug>`, e.g. `json/format`. */
  path: string;
  name: string;
  /** One line, shown in search and on the home page. */
  description: string;
  category: CategoryId;
  priority: Priority;
  /** Alternative search terms, e.g. `['b64']`. */
  aliases?: string[];
  /** Ids of related Tools, shown under the Tool and offered in Send to…. */
  related?: string[];
  /** Engine too large for the app shell; fetched on first use. Not available in the Extension. */
  heavy?: boolean;
  inputKind: InputKind;
  restrictions?: Restriction[];
  /** Smart Paste kinds this Tool can handle directly. */
  accepts?: DetectKind[];
  /** Shown in the Extension's Quick Launcher. */
  quickLauncher?: boolean;
  /** Label for the Extension's right-click menu on selected text. */
  contextMenu?: string;
  /** Text Tools should provide one; see ToolExample. Omit for file-based Tools (they need their own E2E test). */
  example?: ToolExample;
  load: () => Promise<{ default: ComponentType<ToolProps> }>;
  /** Text → text operations usable in the Pipeline. Lazy, e.g. `() => import('./logic').then((m) => [...])`. */
  steps?: () => Promise<PipelineStep[]>;
}

export function defineTool(meta: ToolMeta): ToolMeta {
  return meta;
}

/** An error a Tool shows to the user in plain language. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
