import { Link } from 'wouter';
import { Monitor, Moon, Search, Sun } from 'lucide-react';
import { setTheme, type Theme } from '@/core/preferences';
import { Button } from '@/ui/shadcn/button';
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group';
import { usePreferences } from '../theme';
import { MOD } from '../platform';

const THEMES = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

export function Header({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { theme } = usePreferences();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/icon.svg" alt="" className="size-6" />
          Utility
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:inline">Developer tools · 100% in your browser</span>
        <span className="flex-1" />
        <Button variant="outline" className="w-full max-w-64 justify-start gap-2 text-muted-foreground" onClick={onOpenPalette} data-testid="open-palette">
          <Search />
          <span className="flex-1 text-left">Search tools…</span>
          <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">{MOD} K</kbd>
        </Button>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Theme"
          value={theme}
          onValueChange={(v) => {
            if (v) setTheme(v as Theme);
          }}
        >
          {THEMES.map(({ value, label, Icon }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label} title={label} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </header>
  );
}
