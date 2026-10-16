import { clearPreferences } from '@/core/preferences';
import { Button } from '@/ui/shadcn/button';

export function PrivacyPage() {
  return (
    <article className="prose-sm flex max-w-2xl flex-col gap-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold tracking-tight">Nothing leaves your browser</h1>
      <p>Every Tool runs on your device. We don't have a server that receives your data, and the browser itself enforces this:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>No outgoing connections.</strong> Our Content-Security-Policy (<code>connect-src 'self'</code>) stops this page from sending data to any
          other website. Open your browser's DevTools, check the response headers, and watch the Network tab while you use a Tool.
        </li>
        <li>
          <strong>No analytics, no trackers, no third-party scripts or fonts.</strong> Everything is served from this site.
        </li>
        <li>
          <strong>Works offline.</strong> After your first visit you can disconnect from the internet and keep using the Tools you've opened. Large engines
          (for example, video conversion) are downloaded from this site the first time you use them, then cached.
        </li>
        <li>
          <strong>Your input is never saved.</strong> The only things stored on your device are your theme, your favourite Tools and your recently used
          Tools (names only).
        </li>
      </ul>
      <p className="text-muted-foreground">
        Your browser may still sync or back up its own data (outside our control). Content you paste is only in memory and is gone when you close the
        tab.
      </p>
      <div>
        <Button variant="outline" onClick={() => clearPreferences()}>
          Clear favourites, recent Tools and settings
        </Button>
      </div>
    </article>
  );
}
