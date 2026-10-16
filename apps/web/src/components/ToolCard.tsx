import { useId } from 'react';
import { Link } from 'wouter';
import { categoryColour, categoryIcon, categoryName } from '@/core/categories';
import type { ToolMeta } from '@/core/types';

/**
 * A Tool in a list. Browse grids show the name and the Category colour edge only; the description appears on hover and focus.
 * Search results (`detailed`) also show the description and Category, the matched Alias (`alias`, e.g. "b64 → Base64"),
 * and mark developer Tools with a "Dev" tag.
 */
export function ToolCard({ tool, detailed = false, alias }: { tool: ToolMeta; detailed?: boolean; alias?: string }) {
  const edge = { borderLeftColor: categoryColour(tool.category) };
  const className = 'group flex flex-col gap-1 rounded-lg border border-l-4 bg-card px-3 py-2 transition-colors hover:bg-accent focus-visible:bg-accent';
  if (detailed) {
    const Icon = categoryIcon(tool.category);
    return (
      <Link href={`/${tool.path}`} className={className} style={edge} data-testid={`tool-card-${tool.id}`}>
        <span className="flex items-center gap-2 text-sm font-medium">
          {tool.name}
          {tool.audience === 'developer' && <DevTag />}
        </span>
        {alias && (
          <span className="text-xs text-muted-foreground" data-testid="matched-alias">
            {alias} → {tool.name}
          </span>
        )}
        <span className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="size-3" style={{ color: categoryColour(tool.category) }} aria-hidden />
          {categoryName(tool.category)}
        </span>
      </Link>
    );
  }
  return <BrowseCard tool={tool} className={className} edge={edge} />;
}

/** Name-only card; the description is a CSS tooltip shown on hover and keyboard focus (kept out of Radix to protect the shell budget). */
function BrowseCard({ tool, className, edge }: { tool: ToolMeta; className: string; edge: { borderLeftColor: string } }) {
  const tipId = useId();
  return (
    <div className="group relative">
      <Link href={`/${tool.path}`} className={`${className} text-sm font-medium`} style={edge} aria-describedby={tipId} data-testid={`tool-card-${tool.id}`}>
        {tool.name}
      </Link>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none invisible absolute top-full left-0 z-30 mt-1 w-max max-w-64 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg group-focus-within:visible group-hover:visible"
      >
        {tool.description}
      </span>
    </div>
  );
}

export function DevTag() {
  return <span className="rounded border px-1 text-[10px] font-normal text-muted-foreground uppercase">Dev</span>;
}
