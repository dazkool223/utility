import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Star } from 'lucide-react';
import { getTool, getToolByPath } from '@/core/registry';
import { categoryName } from '@/core/categories';
import { clearPendingInput, peekPendingInput } from '@/core/host';
import { recordRecent, toggleFavourite } from '@/core/preferences';
import type { ToolMeta, ToolProps } from '@/core/types';
import { RestrictionNotes } from '@/ui/controls';
import { ToolMetaContext } from '@/ui/context';
import { Button } from '@/ui/shadcn/button';
import { Badge } from '@/ui/shadcn/badge';
import { cn } from '@/ui/lib/utils';
import { usePreferences } from '../theme';
import { useSurface } from '../surface';
import { NotFound } from './NotFound';

const lazyCache = new Map<string, ComponentType<ToolProps>>();
function toolComponent(meta: ToolMeta): ComponentType<ToolProps> {
  let c = lazyCache.get(meta.id);
  if (!c) {
    c = lazy(meta.load);
    lazyCache.set(meta.id, c);
  }
  return c;
}

class ToolErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">This Tool hit an unexpected error.</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{this.state.error.message}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => this.setState({ error: null })}>
            Reload Tool
          </Button>
        </div>
      );
    return this.props.children;
  }
}

export function ToolPage({ path }: { path: string }) {
  const meta = getToolByPath(path);
  if (!meta) return <NotFound />;
  return <ToolView key={meta.id} meta={meta} />;
}

function ToolView({ meta }: { meta: ToolMeta }) {
  const { favourites } = usePreferences();
  const { surface, websiteUrl } = useSurface();
  const linkOut = surface === 'extension' && meta.heavy;
  const isFavourite = favourites.includes(meta.id);
  const [pending] = useState(() => peekPendingInput(meta.id));
  const ToolComponent = toolComponent(meta);
  const restrictions = (meta.restrictions ?? []).filter((r) => !r.applies || r.applies());
  const related = (meta.related ?? []).map(getTool).filter((t) => t !== undefined);

  useEffect(() => {
    recordRecent(meta.id);
    document.title = `${meta.name} — Utility`;
    return () => {
      clearPendingInput(meta.id);
      document.title = 'Utility — developer tools in your browser';
    };
  }, [meta]);

  return (
    <ToolMetaContext.Provider value={meta}>
      <article className="flex flex-col gap-4" data-testid="tool-page" data-tool-id={meta.id}>
        <header className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">
                Tools
              </Link>{' '}
              / <Link href={`/category/${meta.category}`}>{categoryName(meta.category)}</Link>
            </nav>
            <h1 className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight">
              {meta.name}
              {meta.heavy && <Badge variant="secondary">Downloads an engine on first use</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={isFavourite}
            onClick={() => toggleFavourite(meta.id)}
            data-testid="favourite"
          >
            <Star className={cn(isFavourite && 'fill-current text-brand')} />
            {isFavourite ? 'Favourite' : 'Add to favourites'}
          </Button>
        </header>
        <RestrictionNotes messages={restrictions.map((r) => r.message)} />
        {linkOut ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6 text-sm" data-testid="heavy-link-out">
            <p>This Tool needs a large engine, so to keep the extension light it runs on the website. It still runs entirely in your browser.</p>
            <Button asChild>
              <a href={`${websiteUrl}/${meta.path}`} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open {meta.name} on the website
              </a>
            </Button>
          </div>
        ) : (
        <ToolErrorBoundary>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" aria-label="Loading Tool" />}>
            <ToolComponent initialInput={pending?.input} initialFiles={pending?.files} />
          </Suspense>
        </ToolErrorBoundary>
        )}
        {related.length > 0 && (
          <aside className="flex flex-wrap items-center gap-2 pt-2 text-sm">
            <span className="text-muted-foreground">Related:</span>
            {related.map((t) => (
              <Link key={t.id} href={`/${t.path}`} className="rounded-md border px-2 py-1 hover:bg-accent">
                {t.name}
              </Link>
            ))}
          </aside>
        )}
      </article>
    </ToolMetaContext.Provider>
  );
}
