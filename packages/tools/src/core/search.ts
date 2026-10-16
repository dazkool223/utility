import { categoryName } from './categories';
import type { ToolMeta } from './types';

/** Score how well `query` matches `text`: exact > prefix > word prefix > substring > subsequence. 0 = no match. */
function scoreText(query: string, text: string): number {
  const t = text.toLowerCase();
  if (t === query) return 100;
  if (t.startsWith(query)) return 80;
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) return 60;
  if (t.includes(query)) return 40;
  let qi = 0;
  for (let i = 0; i < t.length && qi < query.length; i++) if (t[i] === query[qi]) qi++;
  return qi === query.length ? 10 : 0;
}

function scoreTool(term: string, tool: ToolMeta): number {
  const fields: Array<[string, number]> = [
    [tool.name, 1.0],
    ...(tool.aliases ?? []).map((a): [string, number] => [a, 0.95]),
    [categoryName(tool.category), 0.5],
    [tool.description, 0.4],
  ];
  let best = 0;
  for (const [text, weight] of fields) {
    const s = scoreText(term, text) * weight;
    // Subsequence matches only count against the name, otherwise long descriptions match everything.
    if (s > best && (scoreText(term, text) > 10 || text === tool.name)) best = s;
  }
  return best;
}

/** Fuzzy search over Tools. Every whitespace-separated term must match something. */
export function searchTools(query: string, tools: readonly ToolMeta[]): ToolMeta[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...tools];
  const priorityBoost = { P0: 3, P1: 2, P2: 1 } as const;
  return tools
    .map((tool) => {
      let total = 0;
      for (const term of terms) {
        const s = scoreTool(term, tool);
        if (s === 0) return { tool, score: 0 };
        total += s;
      }
      return { tool, score: total + priorityBoost[tool.priority] };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .map((r) => r.tool);
}
