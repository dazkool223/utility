import { Link } from 'wouter';
import type { ToolMeta } from '@/core/types';

/** `showDevTag`: mark developer Tools (used in search results, which cover every Tool). */
export function ToolCard({ tool, showDevTag = false }: { tool: ToolMeta; showDevTag?: boolean }) {
  return (
    <Link
      href={`/${tool.path}`}
      className="group flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-foreground/30 hover:bg-accent"
      data-testid={`tool-card-${tool.id}`}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {tool.name}
        {showDevTag && tool.audience === 'developer' && <DevTag />}
      </span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</span>
    </Link>
  );
}

export function DevTag() {
  return <span className="rounded border px-1 text-[10px] font-normal text-muted-foreground uppercase">Dev</span>;
}
