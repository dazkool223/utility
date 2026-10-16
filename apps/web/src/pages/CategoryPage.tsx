import { Link } from 'wouter';
import { TOOLS } from '@/core/registry';
import { browseCategoryTools } from '@/core/audience';
import { CATEGORIES, categoryColour } from '@/core/categories';
import { Button } from '@/ui/shadcn/button';
import { ToolCard } from '../components/ToolCard';
import { useDeveloperTools } from '../audience';
import { NotFound } from './NotFound';

/** One Category: a dense, name-only grid of its Tools. Respects the Developer tools switch. */
export function CategoryPage({ id }: { id: string }) {
  const category = CATEGORIES.find((c) => c.id === id);
  const [showDeveloper, setShowDeveloper] = useDeveloperTools();
  if (!category) return <NotFound />;
  const tools = browseCategoryTools(TOOLS, category.id, showDeveloper);
  const Icon = category.icon;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          Tools
        </Link>{' '}
        / {category.name}
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          <Icon className="size-6" style={{ color: categoryColour(category.id) }} aria-hidden />
          {category.name}
        </h1>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </header>
      {tools.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
          <p>The Tools in here are made for developers, so they are tucked away for now.</p>
          <Button variant="outline" size="sm" onClick={() => setShowDeveloper(true)}>
            Show developer Tools
          </Button>
        </div>
      )}
    </div>
  );
}
