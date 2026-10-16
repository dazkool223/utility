import { Link } from 'wouter';
import type { ToolMeta } from '@/core/types';

export function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link
      href={`/${tool.path}`}
      className="group flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-foreground/30 hover:bg-accent"
      data-testid={`tool-card-${tool.id}`}
    >
      <span className="text-sm font-medium">{tool.name}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</span>
    </Link>
  );
}
