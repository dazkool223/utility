import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Download, ExternalLink, Star } from 'lucide-react';
import { getTool, getToolByPath } from '@/core/registry';
import { categoryColour, categoryName } from '@/core/categories';
import { clearPendingInput, peekPendingInput } from '@/core/host';
import { engineAvailableOffline, setGuaranteeProblem } from '../guarantee';
import { recordRecent, toggleFavourite } from '@/core/preferences';
import type { ToolMeta, ToolProps } from '@/core/types';
import { RestrictionNotes } from '@/ui/controls';
import { ToolMetaContext } from '@/ui/context';
import { Button } from '@/ui/shadcn/button';
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select';
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
  const [, navigate] = useLocation();

  useEffect(() => {
    recordRecent(meta.id);
    document.title = `${meta.name} — Utility`;
    return () => {
      clearPendingInput(meta.id);
      document.title = 'Utility — developer tools in your browser';
    };
  }, [meta]);

  // A Heavy Tool whose engine is not cached yet cannot run offline: that is the one time the privacy chip changes.
  useEffect(() => {
    if (!meta.heavy || linkOut) return;
    let alive = true;
    const check = async () => {
      const ok = navigator.onLine || (await engineAvailableOffline(meta.path));
      if (alive) setGuaranteeProblem(ok ? null : 'You are offline, and this Tool has not downloaded its engine yet. Reconnect once to fetch it.');
    };
    void check();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    return () => {
      alive = false;
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      setGuaranteeProblem(null);
    };
  }, [meta, linkOut]);

  return (
    <ToolMetaContext.Provider value={meta}>
      <article className="flex flex-col gap-4" data-testid="tool-page" data-tool-id={meta.id}>
        <header
          className="flex flex-wrap items-center gap-3 rounded-xl border border-l-4 bg-card px-4 py-3 shadow-sm"
          style={{ borderLeftColor: categoryColour(meta.category) }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">
                Tools
              </Link>{' '}
              / <Link href={`/category/${meta.category}`}>{categoryName(meta.category)}</Link>
            </nav>
            <h1 className="font-serif text-xl font-semibold tracking-tight">{meta.name}</h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
            {meta.heavy && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="heavy-note">
                <Download className="size-3.5" aria-hidden />
                Downloads its engine the first time you use it, then works offline.
              </p>
            )}
          </div>
          {related.length > 0 && (
            <NativeSelect
              size="sm"
              aria-label="Works well with"
              className="w-auto"
              value=""
              onChange={(e) => {
                if (e.target.value) navigate(`/${e.target.value}`);
              }}
            >
              <NativeSelectOption value="">Works well with…</NativeSelectOption>
              {related.map((t) => (
                <NativeSelectOption key={t.id} value={t.path}>
                  {t.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={isFavourite}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => toggleFavourite(meta.id)}
            data-testid="favourite"
          >
            <Star className={cn(isFavourite && 'fill-current text-brand')} />
          </Button>
        </header>
        <RestrictionNotes messages={restrictions.map((r) => r.message)} />
        {linkOut ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6 text-sm" data-testid="heavy-link-out">
            <p>This Tool needs a large engine, so to keep the extension light it runs on the website.</p>
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
      </article>
    </ToolMetaContext.Provider>
  );
}
