import { StrictMode, Suspense, lazy, useMemo, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { TOOLS, getTool } from '@/core/registry';
import { registerNavigate } from '@/core/host';
import { searchTools } from '@/core/search';
import type { ToolMeta, ToolProps } from '@/core/types';
import { ToolMetaContext } from '@/ui/context';
import { Button } from '@/ui/shadcn/button';
import { Input } from '@/ui/shadcn/input';
import { WEBSITE_URL } from '~web/surface';
import './extension.css';

// Quick Launcher (spec §6): instant text Tools run right in the popup; anything else opens in an Extension tab.
const QUICK = TOOLS.filter((t) => t.quickLauncher && !t.heavy);
const openInTab = (tool: ToolMeta) => chrome.tabs.create({ url: chrome.runtime.getURL(`app.html#/${tool.path}`) });

// Send to… from inside the popup opens the target in a tab.
registerNavigate((id) => {
  const t = getTool(id);
  if (t) void openInTab(t);
});

const lazyCache = new Map<string, ComponentType<ToolProps>>();

function Popup() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<ToolMeta | null>(null);
  const list = useMemo(() => (query.trim() ? searchTools(query, TOOLS).slice(0, 12) : QUICK), [query]);

  if (active) {
    let Tool = lazyCache.get(active.id);
    if (!Tool) lazyCache.set(active.id, (Tool = lazy(active.load)));
    return (
      <ToolMetaContext.Provider value={active}>
        <div className="flex h-full flex-col gap-2 overflow-auto p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActive(null)} aria-label="Back to Quick Launcher">
              <ArrowLeft />
            </Button>
            <h1 className="flex-1 text-sm font-semibold">{active.name}</h1>
            <Button variant="outline" size="sm" onClick={() => void openInTab(active)}>
              <ExternalLink />
              Open in tab
            </Button>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
            <Tool />
          </Suspense>
        </div>
      </ToolMetaContext.Provider>
    );
  }

  const choose = (tool: ToolMeta) => (tool.quickLauncher && !tool.heavy ? setActive(tool) : void openInTab(tool));

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) choose(list[0]);
          }}
          placeholder="Search all tools…"
          aria-label="Search tools"
          className="pl-9"
        />
      </div>
      <ul className="grid flex-1 grid-cols-2 content-start gap-2 overflow-auto">
        {list.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => choose(t)}
              className="flex w-full flex-col gap-0.5 rounded-lg border bg-card px-3 py-2 text-left hover:bg-accent"
            >
              <span className="text-sm font-medium">{t.name}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{t.description}</span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
        <button type="button" className="underline underline-offset-2" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('app.html') })}>
          All {TOOLS.length} tools
        </button>
        <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Also free on the website
        </a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
