import { Link } from 'wouter';
import { categoryColour, categoryIcon, categoryName } from '@/core/categories';
import type { ToolMeta } from '@/core/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip';

/**
 * A Tool in a list. Browse grids show the name and the Category colour edge only; the description appears on hover and focus.
 * Search results (`detailed`) also show the description and Category, and mark developer Tools with a "Dev" tag.
 */
export function ToolCard({ tool, detailed = false }: { tool: ToolMeta; detailed?: boolean }) {
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
        <span className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="size-3" style={{ color: categoryColour(tool.category) }} aria-hidden />
          {categoryName(tool.category)}
        </span>
      </Link>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/${tool.path}`} className={`${className} text-sm font-medium`} style={edge} data-testid={`tool-card-${tool.id}`}>
          {tool.name}
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{tool.description}</TooltipContent>
    </Tooltip>
  );
}

export function DevTag() {
  return <span className="rounded border px-1 text-[10px] font-normal text-muted-foreground uppercase">Dev</span>;
}
