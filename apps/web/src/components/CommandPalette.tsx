import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Command as CommandPrimitive } from 'cmdk';
import { Eraser, Moon, Sparkles, Star, Wrench } from 'lucide-react';
import { TOOLS, getToolByPath, toolsForKinds } from '@/core/registry';
import { searchTools } from '@/core/search';
import { categoryName } from '@/core/categories';
import { detectText } from '@/core/detect';
import { setPendingInput } from '@/core/host';
import { clearPreferences, getPreferences, setTheme, toggleFavourite } from '@/core/preferences';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/ui/shadcn/dialog';
import { CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/ui/shadcn/command';
import { usePreferences } from '../theme';
import { DevTag } from './ToolCard';

const KIND_LABEL: Record<string, string> = {
  jwt: 'JWT',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  csv: 'CSV',
  base64: 'Base64',
  timestamp: 'Unix timestamp',
  uuid: 'UUID',
  url: 'URL',
  'url-encoded': 'URL-encoded text',
  cron: 'cron expression',
  'pem-cert': 'certificate',
  'pem-csr': 'CSR',
  'pem-key': 'key',
  hex: 'hex',
  color: 'colour',
  ip: 'IP address',
  cidr: 'CIDR range',
  html: 'HTML',
  sql: 'SQL',
  curl: 'cURL command',
  markdown: 'Markdown',
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [location, navigate] = useLocation();
  const { favourites, recent } = usePreferences();

  const close = () => {
    onOpenChange(false);
    setQuery('');
  };
  const openTool = (id: string, input?: string) => {
    const tool = TOOLS.find((t) => t.id === id);
    if (!tool) return;
    if (input !== undefined) setPendingInput(id, { input });
    close();
    navigate(`/${tool.path}`);
  };

  // Smart Paste: if the query looks like data rather than a tool name, suggest Tools for it.
  const smart = useMemo(() => {
    if (query.length < 6) return null;
    const kinds = detectText(query).filter((k) => k !== 'text' && k !== 'markdown');
    if (!kinds.length) return null;
    const tools = toolsForKinds(kinds).slice(0, 5);
    return tools.length ? { label: KIND_LABEL[kinds[0]!] ?? kinds[0]!, tools } : null;
  }, [query]);

  const results = useMemo(() => (smart ? [] : searchTools(query, TOOLS).slice(0, 30)), [query, smart]);
  const current = getToolByPath(location);
  const recentTools = recent.map((id) => TOOLS.find((t) => t.id === id)).filter((t) => t !== undefined);
  const favouriteTools = favourites.map((id) => TOOLS.find((t) => t.id === id)).filter((t) => t !== undefined);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search Tools, paste data to find a matching Tool, or run an action.</DialogDescription>
        <CommandPrimitive shouldFilter={false} loop className="flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground" data-testid="palette">
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search tools, or paste anything…"
              className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              data-testid="palette-input"
            />
          </div>
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No Tools match “{query}”.</CommandEmpty>
            {smart && (
              <CommandGroup heading={`Looks like a ${smart.label}`}>
                {smart.tools.map((t) => (
                  <CommandItem key={t.id} value={`smart-${t.id}`} onSelect={() => openTool(t.id, query)}>
                    <Sparkles />
                    <span>Open in {t.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!query && favouriteTools.length > 0 && (
              <CommandGroup heading="Favourites">
                {favouriteTools.map((t) => (
                  <CommandItem key={t.id} value={`fav-${t.id}`} onSelect={() => openTool(t.id)}>
                    <Star />
                    {t.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!query && recentTools.length > 0 && (
              <CommandGroup heading="Recent">
                {recentTools.map((t) => (
                  <CommandItem key={t.id} value={`recent-${t.id}`} onSelect={() => openTool(t.id)}>
                    <Wrench />
                    {t.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.length > 0 && (
              <CommandGroup heading={query ? 'Tools' : 'All Tools'}>
                {results.map((t) => (
                  <CommandItem key={t.id} value={t.id} onSelect={() => openTool(t.id)} data-testid={`palette-item-${t.id}`}>
                    <Wrench />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.audience === 'developer' && <DevTag />}
                    <CommandShortcut>{categoryName(t.category)}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!smart && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  {current && (
                    <CommandItem
                      value="action-favourite"
                      onSelect={() => {
                        toggleFavourite(current.id);
                        close();
                      }}
                    >
                      <Star />
                      {getPreferences().favourites.includes(current.id) ? 'Remove from favourites' : 'Add to favourites'}
                    </CommandItem>
                  )}
                  <CommandItem
                    value="action-theme"
                    onSelect={() => {
                      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
                      close();
                    }}
                  >
                    <Moon />
                    Toggle dark mode
                  </CommandItem>
                  <CommandItem
                    value="action-clear"
                    onSelect={() => {
                      clearPreferences();
                      close();
                    }}
                  >
                    <Eraser />
                    Clear favourites, recent Tools and settings
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
