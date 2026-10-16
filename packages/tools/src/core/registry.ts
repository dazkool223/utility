import type { ToolMeta } from './types';
import type { DetectKind } from './detect';

// Every Tool lives at src/tools/<category>/<slug>/meta.ts and is discovered automatically.
const modules = import.meta.glob<ToolMeta>('../tools/*/*/meta.ts', { eager: true, import: 'default' });

export const TOOLS: readonly ToolMeta[] = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name));

const byId = new Map(TOOLS.map((t) => [t.id, t]));
const byPath = new Map(TOOLS.map((t) => [t.path, t]));

export function getTool(id: string): ToolMeta | undefined {
  return byId.get(id);
}

export function getToolByPath(path: string): ToolMeta | undefined {
  return byPath.get(path.replace(/^\/+|\/+$/g, ''));
}

/** Tools that accept any of `kinds`, ordered by how early the kind appears (best detection first). */
export function toolsForKinds(kinds: readonly DetectKind[], tools: readonly ToolMeta[] = TOOLS): ToolMeta[] {
  const ranked: Array<{ tool: ToolMeta; rank: number }> = [];
  for (const tool of tools) {
    const ranks = (tool.accepts ?? []).map((k) => kinds.indexOf(k)).filter((i) => i >= 0);
    if (ranks.length) ranked.push({ tool, rank: Math.min(...ranks) });
  }
  const priority = { P0: 0, P1: 1, P2: 2 } as const;
  return ranked.sort((a, b) => a.rank - b.rank || priority[a.tool.priority] - priority[b.tool.priority]).map((r) => r.tool);
}
