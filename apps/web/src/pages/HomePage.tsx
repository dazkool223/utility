import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { TOOLS, getTool } from '@/core/registry';
import { browseCategories, browseCategoryTools } from '@/core/audience';
import { categoryColour, type Category } from '@/core/categories';
import { searchTools } from '@/core/search';
import { Input } from '@/ui/shadcn/input';
import { ToolCard } from '../components/ToolCard';
import { SmartPaste } from '../components/SmartPaste';
import { useDeveloperTools } from '../audience';
import { usePreferences } from '../theme';

export function HomePage() {
  const [query, setQuery] = useState('');
  const { favourites, recent } = usePreferences();
  const [showDeveloper] = useDeveloperTools();
  const results = useMemo(() => (query.trim() ? searchTools(query, TOOLS) : null), [query]);
  const favouriteTools = favourites.map(getTool).filter((t) => t !== undefined);
  const recentTools = recent.map(getTool).filter((t) => t !== undefined);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 pt-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{TOOLS.length} developer tools. Nothing leaves your browser.</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, e.g. “jwt”, “b64”, “pdf merge”…"
            aria-label="Search tools"
            className="h-11 pl-9 text-base"
            data-testid="home-search"
          />
        </div>
        {!results && <SmartPaste />}
      </section>

      {results ? (
        <section aria-label="Search results">
          {results.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t) => (
                <ToolCard key={t.id} tool={t} detailed />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Tools match “{query}”.</p>
          )}
        </section>
      ) : (
        <>
          {favouriteTools.length > 0 && <ToolGroup title="Favourites" tools={favouriteTools} />}
          {recentTools.length > 0 && <ToolGroup title="Recent" tools={recentTools} />}
          {browseCategories(TOOLS, showDeveloper).map((c) => (
            <ToolGroup key={c.id} id={c.id} category={c} title={c.name} subtitle={c.description} tools={browseCategoryTools(TOOLS, c.id, showDeveloper)} />
          ))}
        </>
      )}
    </div>
  );
}

function ToolGroup({ id, category, title, subtitle, tools }: { id?: string; category?: Category; title: string; subtitle?: string; tools: readonly import('@/core/types').ToolMeta[] }) {
  const Icon = category?.icon;
  return (
    <section id={id} aria-labelledby={`${title}-h`} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 id={`${title}-h`} className={category ? 'flex items-center gap-2 font-serif text-lg font-semibold' : 'text-base font-semibold'}>
          {Icon && <Icon className="size-4" style={{ color: categoryColour(category!.id) }} aria-hidden />}
          {title}
        </h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  );
}
