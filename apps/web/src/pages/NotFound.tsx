import { Link } from 'wouter';
import { Button } from '@/ui/shadcn/button';

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h1 className="font-serif text-2xl font-semibold">We can't find that page</h1>
      <p className="max-w-prose text-sm text-muted-foreground">The link may be old, or the Tool may have moved. Try searching for what you need and we will point you the right way.</p>
      <Button asChild>
        <Link href="/">Take me home</Link>
      </Button>
    </div>
  );
}
