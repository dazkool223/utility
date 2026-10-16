import { Link } from 'wouter';

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-2 py-12">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">That Tool doesn't exist, or it has moved.</p>
      <Link href="/" className="text-sm underline underline-offset-2">
        Back to all Tools
      </Link>
    </div>
  );
}
