import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { getTool } from '@/core/registry';
import { registerNavigate, TOOL_EVENTS } from '@/core/host';
import { TooltipProvider } from '@/ui/shadcn/tooltip';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ToolPage } from './pages/ToolPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFound } from './pages/NotFound';
import { SurfaceContext, WEBSITE_URL, type SurfaceConfig } from './surface';

// Loaded on first open to keep the app shell small.
const CommandPalette = lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));


/** The app shell shared by the Website and the Extension (ADR 0002). Routing is provided by the caller. */
export function App({ surface = { surface: 'website', websiteUrl: WEBSITE_URL } }: { surface?: SurfaceConfig }) {
  const [, navigate] = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  useEffect(() => {
    if (paletteOpen) setPaletteLoaded(true);
  }, [paletteOpen]);

  useEffect(() => {
    registerNavigate((id) => {
      const tool = getTool(id);
      if (tool) navigate(`/${tool.path}`);
    });
  }, [navigate]);

  // Minimal fixed shortcuts (spec §7.3).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Accept both Ctrl and ⌘ so the shortcuts work regardless of OS detection.
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (mod && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new Event(TOOL_EVENTS.run));
      } else if (e.altKey && e.shiftKey && !mod && e.code === 'KeyC') {
        e.preventDefault();
        window.dispatchEvent(new Event(TOOL_EVENTS.copyOutput));
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  return (
    <SurfaceContext.Provider value={surface}>
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-svh flex-col">
        <Header onOpenPalette={() => setPaletteOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/:category/:slug">{(params) => <ToolPage path={`${params.category}/${params.slug}`} />}</Route>
            <Route component={NotFound} />
          </Switch>
        </main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          Everything runs in your browser. Nothing you enter leaves your device.{' '}
          <Link className="underline underline-offset-2" href="/privacy">
            How we guarantee it
          </Link>
          {surface.surface === 'extension' && (
            <>
              {' · '}
              <a className="underline underline-offset-2" href={surface.websiteUrl} target="_blank" rel="noreferrer">
                All tools, free, on the website
              </a>
            </>
          )}
        </footer>
      </div>
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      )}
    </TooltipProvider>
    </SurfaceContext.Provider>
  );
}
