import { useState } from 'react';
import { TOOLS, getTool } from '@/core/registry';
import { browseCategories, browseCategoryTools } from '@/core/audience';
import { categoryColour, type Category } from '@/core/categories';
import type { ToolMeta } from '@/core/types';
import { ToolCard } from '../components/ToolCard';
import { Bench } from '../components/Bench';
import { useDeveloperTools } from '../audience';
import { usePreferences } from '../theme';

export function HomePage() {
  const [text, setText] = useState('');
  const { favourites, recent } = usePreferences();
  const [showDeveloper] = useDeveloperTools();
  const favouriteTools = favourites.map(getTool).filter((t) => t !== undefined);
  const recentTools = recent.map(getTool).filter((t) => t !== undefined);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 pt-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Hello. What are we working on today?</h1>
        <Bench text={text} onTextChange={setText} />
      </section>

      {!text.trim() && (
        <>
          <ToolGroup title="Favourites" tools={favouriteTools} empty="Nothing pinned yet. Press the star on any Tool and it will wait for you here." />
          <ToolGroup title="Recent" tools={recentTools} empty="Tools you open will show up here, so you can get back to them quickly." />
          {browseCategories(TOOLS, showDeveloper).map((c) => (
            <ToolGroup key={c.id} id={c.id} category={c} title={c.name} subtitle={c.description} tools={browseCategoryTools(TOOLS, c.id, showDeveloper)} />
          ))}
        </>
      )}
    </div>
  );
}

function ToolGroup({ id, category, title, subtitle, tools, empty }: { id?: string; category?: Category; title: string; subtitle?: string; tools: readonly ToolMeta[]; empty?: string }) {
  const Icon = category?.icon;
  return (
    <section id={id} aria-labelledby={`${title}-h`} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 id={`${title}-h`} className={category ? 'flex items-center gap-2 font-serif text-lg font-semibold' : 'text-base font-semibold'}>
          {Icon && <Icon className="size-4" style={{ color: categoryColour(category!.id) }} aria-hidden />}
          {title}
        </h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {tools.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
