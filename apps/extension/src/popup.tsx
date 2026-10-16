import { StrictMode, Suspense, lazy, useMemo, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ExternalLink, Search, Sparkles } from 'lucide-react';
import { TOOLS, getTool } from '@/core/registry';
import { registerNavigate } from '@/core/host';
import { searchToolsWithMatch } from '@/core/search';
import { browseTools } from '@/core/audience';
import { recordRecent } from '@/core/preferences';
import { categoryColour, categoryName } from '@/core/categories';
import type { ToolMeta, ToolProps } from '@/core/types';
import { ToolMetaContext } from '@/ui/context';
import { Button } from '@/ui/shadcn/button';
import { WEBSITE_URL, SurfaceContext } from '~web/surface';
import { useDeveloperTools } from '~web/audience';
import { usePreferences } from '~web/theme';
import { DeveloperToggle } from '~web/components/DeveloperToggle';
import { suggestForText } from '~web/smartPaste';
import { putHandover } from './handover';
import './extension.css';

// Quick Launcher (spec §6): a compact single-column bench. Instant text Tools run right in the popup;
// anything else opens in an Extension tab, and Heavy Tools show a clear link out to the Website there.
const QUICK = TOOLS.filter((t) => t.quickLauncher && !t.heavy);
const isInline = (tool: ToolMeta) => !!tool.quickLauncher && !tool.heavy;

async function openInTab(tool: ToolMeta, input?: string) {
  if (input !== undefined) await putHandover({ toolId: tool.id, input });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`app.html#/${tool.path}`) });
}

// Send to… from inside the popup opens the target in a tab.
registerNavigate((id) => {
  const t = getTool(id);
  if (t) void openInTab(t);
});

const lazyCache = new Map<string, ComponentType<ToolProps>>();

function Popup() {
  const [text, setText] = useState('');
  const [active, setActive] = useState<{ tool: ToolMeta; input?: string } | null>(null);
  const { favourites, recent } = usePreferences();
  const [showDeveloper] = useDeveloperTools();
  const query = text.trim();
  const isSearch = query.length > 0 && query.length <= 80 && !query.includes('\n');
  const results = useMemo(() => (isSearch ? searchToolsWithMatch(query, TOOLS).slice(0, 12) : []), [isSearch, query]);
  const suggestion = useMemo(() => suggestForText(text), [text]);
  const favouriteTools = favourites.map(getTool).filter((t) => t !== undefined);
  const recentTools = recent.map(getTool).filter((t) => t !== undefined);

  const choose = (tool: ToolMeta, input?: string) => {
    recordRecent(tool.id);
    if (isInline(tool)) setActive({ tool, input });
    else void openInTab(tool, input);
  };

  if (active) {
    const { tool, input } = active;
    let Tool = lazyCache.get(tool.id);
    if (!Tool) lazyCache.set(tool.id, (Tool = lazy(tool.load)));
    return (
      <ToolMetaContext.Provider value={tool}>
        <div className="flex h-full flex-col gap-2 overflow-auto p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActive(null)} aria-label="Back to Quick Launcher">
              <ArrowLeft />
            </Button>
            <h1 className="flex-1 font-serif text-base font-semibold">{tool.name}</h1>
            <Button variant="outline" size="sm" onClick={() => void openInTab(tool, input)}>
              <ExternalLink />
              Open in tab
            </Button>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
            <Tool initialInput={input} />
          </Suspense>
        </div>
      </ToolMetaContext.Provider>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !suggestion && results[0]) {
              e.preventDefault();
              choose(results[0].tool);
            }
          }}
          rows={1}
          spellCheck={false}
          aria-label="Search Tools, or paste anything"
          placeholder="Search Tools, or paste anything…"
          className="block max-h-28 min-h-10 w-full resize-none rounded-lg border bg-popover py-2.5 pr-3 pl-9 font-mono text-sm [field-sizing:content] outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      {suggestion && (
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="smart-paste-result">
          <Sparkles className="size-4 text-brand" aria-hidden />
          <span className="text-muted-foreground">Looks like {suggestion.label}. Open it in:</span>
          {suggestion.tools.map((t, i) => (
            <Button key={t.id} size="sm" variant={i === 0 ? 'default' : 'secondary'} onClick={() => choose(t, text)}>
              {t.name}
            </Button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isSearch ? (
          results.length ? (
            <ul className="flex flex-col gap-1" aria-label="Search results">
              {results.map(({ tool, alias }) => (
                <ToolRow key={tool.id} tool={tool} detail={alias ? `${alias} → ${tool.name}` : categoryName(tool.category)} onChoose={() => choose(tool)} />
              ))}
            </ul>
          ) : (
            !suggestion && <p className="text-sm text-muted-foreground">Nothing called “{query}” yet. Try a shorter word, or paste what you have.</p>
          )
        ) : (
          !suggestion && (
            <div className="flex flex-col gap-4">
              <Section title="Favourites" tools={favouriteTools} empty="Press the star on a Tool in the full app and it will wait for you here." onChoose={choose} />
              <Section title="Recent" tools={recentTools} empty="Tools you open will show up here." onChoose={choose} />
              <Section title="Quick tools" tools={browseTools(QUICK, showDeveloper)} onChoose={choose} />
            </div>
          )
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t pt-2 text-xs text-muted-foreground">
        <DeveloperToggle />
        <span className="flex items-center gap-3">
          <button type="button" className="underline underline-offset-2" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('app.html') })}>
            All {TOOLS.length} Tools
          </button>
          <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Also free on the website
          </a>
        </span>
      </footer>
    </div>
  );
}

function Section({ title, tools, empty, onChoose }: { title: string; tools: readonly ToolMeta[]; empty?: string; onChoose: (tool: ToolMeta) => void }) {
  if (!tools.length && !empty) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {tools.length ? (
        <ul className="grid grid-cols-2 gap-1.5">
          {tools.map((t) => (
            <ToolRow key={t.id} tool={t} onChoose={() => onChoose(t)} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function ToolRow({ tool, detail, onChoose }: { tool: ToolMeta; detail?: string; onChoose: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onChoose}
        title={tool.description}
        className="flex w-full items-center gap-2 rounded-lg border border-l-4 bg-card px-3 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent"
        style={{ borderLeftColor: categoryColour(tool.category) }}
      >
        <span className="flex-1 truncate font-medium">{tool.name}</span>
        {detail && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
        {tool.heavy && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="size-3" aria-hidden />
            on the website
          </span>
        )}
      </button>
    </li>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SurfaceContext.Provider value={{ surface: 'extension', websiteUrl: WEBSITE_URL }}>
      <Popup />
    </SurfaceContext.Provider>
  </StrictMode>,
);
