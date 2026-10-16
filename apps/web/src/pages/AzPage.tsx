import { TOOLS } from '@/core/registry';
import { browseTools } from '@/core/audience';
import type { ToolMeta } from '@/core/types';
import { ToolCard } from '../components/ToolCard';
import { useDeveloperTools } from '../audience';

const letterOf = (t: ToolMeta) => {
  const c = t.name.charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

/** Every Tool by name, A to Z. Respects the Developer tools switch like the other browsing views. */
export function AzPage() {
  const [showDeveloper] = useDeveloperTools();
  const tools = [...browseTools(TOOLS, showDeveloper)].sort((a, b) => a.name.localeCompare(b.name));
  const groups = new Map<string, ToolMeta[]>();
  for (const t of tools) groups.set(letterOf(t), [...(groups.get(letterOf(t)) ?? []), t]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">A–Z index</h1>
        <p className="text-sm text-muted-foreground">Every Tool by name, for when you know what it is called.</p>
      </header>
      {[...groups].map(([letter, list]) => (
        <section key={letter} aria-labelledby={`az-${letter}`} className="flex flex-col gap-2">
          <h2 id={`az-${letter}`} className="font-serif text-lg font-semibold">
            {letter}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
