import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowDownAZ, Search } from 'lucide-react';
import { TOOLS, getTool } from '@/core/registry';
import { browseCategories } from '@/core/audience';
import { categoryColour } from '@/core/categories';
import { Button } from '@/ui/shadcn/button';
import { useDeveloperTools } from '../audience';
import { MOD } from '../platform';
import { usePreferences } from '../theme';
import { DeveloperToggle } from './DeveloperToggle';

const linkClass = 'flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent focus-visible:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium';

/**
 * The persistent left rail: the Developer tools switch, Favourites, Recent Tools and the Categories.
 * Favourites and Recents ignore the switch; the Category list respects it.
 * `onOpenPalette` is passed only in the narrow-screen menu, where the header has no room for a search control.
 */
export function Rail({ onNavigate, onOpenPalette }: { onNavigate?: () => void; onOpenPalette?: () => void }) {
  const { favourites, recent } = usePreferences();
  const [showDeveloper] = useDeveloperTools();
  const [location] = useLocation();
  const favouriteTools = favourites.map(getTool).filter((t) => t !== undefined);
  const recentTools = recent.map(getTool).filter((t) => t !== undefined);

  return (
    <nav aria-label="Browse Tools" className="flex flex-col gap-5 p-4 text-sm">
      {onOpenPalette && (
        <Button variant="outline" className="justify-start gap-2 text-muted-foreground" onClick={onOpenPalette}>
          <Search />
          <span className="flex-1 text-left">Find a Tool</span>
          <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">{MOD} K</kbd>
        </Button>
      )}
      <DeveloperToggle />
      {favouriteTools.length > 0 && (
        <RailGroup title="Favourites">
          {favouriteTools.map((t) => (
            <li key={t.id}>
              <Link href={`/${t.path}`} className={linkClass} aria-current={location === `/${t.path}` ? 'page' : undefined} onClick={onNavigate} data-testid={`rail-favourite-${t.id}`}>
                {t.name}
              </Link>
            </li>
          ))}
        </RailGroup>
      )}
      {recentTools.length > 0 && (
        <RailGroup title="Recent">
          {recentTools.map((t) => (
            <li key={t.id}>
              <Link href={`/${t.path}`} className={linkClass} aria-current={location === `/${t.path}` ? 'page' : undefined} onClick={onNavigate} data-testid={`rail-recent-${t.id}`}>
                {t.name}
              </Link>
            </li>
          ))}
        </RailGroup>
      )}
      <RailGroup title="Categories">
        <li>
          <Link href="/a-z" className={linkClass} aria-current={location === '/a-z' ? 'page' : undefined} onClick={onNavigate}>
            <ArrowDownAZ className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            A–Z index
          </Link>
        </li>
        {browseCategories(TOOLS, showDeveloper).map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.id}`} className={linkClass} aria-current={location === `/category/${c.id}` ? 'page' : undefined} onClick={onNavigate}>
              <c.icon className="size-4 shrink-0" style={{ color: categoryColour(c.id) }} aria-hidden />
              {c.name}
            </Link>
          </li>
        ))}
      </RailGroup>
    </nav>
  );
}

function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}
