import { Link } from 'wouter';
import { Menu, Monitor, Moon, Sun } from 'lucide-react';
import { setTheme } from '@/core/preferences';
import { Button } from '@/ui/shadcn/button';
import { cn } from '@/ui/lib/utils';
import { usePreferences } from '../theme';

const THEMES = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme } = usePreferences();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={onOpenMenu}>
          <Menu />
        </Button>
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/icon.svg" alt="" className="size-6" />
          Utility
        </Link>
        <span className="flex-1" />
        <div role="radiogroup" aria-label="Theme" className="flex rounded-md border">
          {THEMES.map(({ value, label, Icon }) => (
            <Button
              key={value}
              role="radio"
              aria-checked={theme === value}
              aria-label={label}
              title={label}
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-none first:rounded-l-md last:rounded-r-md', theme === value && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground')}
              onClick={() => setTheme(value)}
            >
              <Icon />
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
