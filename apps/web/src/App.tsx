import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { getTool, getToolByPath } from '@/core/registry';
import { registerNavigate, TOOL_EVENTS } from '@/core/host';
import { Header } from './components/Header';
import { Rail } from './components/Rail';
import { cn } from '@/ui/lib/utils';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AzPage } from './pages/AzPage';
import { ToolPage } from './pages/ToolPage';
import { NotFound } from './pages/NotFound';
import { SurfaceContext, WEBSITE_URL, type SurfaceConfig } from './surface';

// Loaded on first open to keep the app shell small.
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const MobileMenu = lazy(() => import('./components/MobileMenu').then((m) => ({ default: m.MobileMenu })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));


/** The app shell shared by the Website and the Extension (ADR 0002). Routing is provided by the caller. */
export function App({ surface = { surface: 'website', websiteUrl: WEBSITE_URL } }: { surface?: SurfaceConfig }) {
  const [location, navigate] = useLocation();
  const onToolPage = !!getToolByPath(location);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  useEffect(() => {
    if (menuOpen) setMenuLoaded(true);
  }, [menuOpen]);
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
      <div className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <div className="flex flex-1">
          <aside aria-label="Sidebar" className="hidden w-64 shrink-0 border-r lg:block">
            <div className="sticky top-14 max-h-[calc(100svh-3.5rem)] overflow-y-auto">
              <Rail />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" tabIndex={-1} className={cn('mx-auto w-full flex-1 px-4 py-6 outline-none sm:px-6', !onToolPage && 'max-w-7xl')}>
          <Suspense fallback={null}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/a-z" component={AzPage} />
            <Route path="/category/:id">{(params) => <CategoryPage id={params.id} />}</Route>
            <Route path="/:category/:slug">{(params) => <ToolPage path={`${params.category}/${params.slug}`} />}</Route>
            <Route component={NotFound} />
          </Switch>
          </Suspense>
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
        </div>
      </div>
      {menuLoaded && (
        <Suspense fallback={null}>
          <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} onOpenPalette={() => setPaletteOpen(true)} />
        </Suspense>
      )}
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      )}
    </SurfaceContext.Provider>
  );
}
