import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/ui/lib/utils';
import { useGuaranteeProblem } from '../guarantee';

/**
 * The only place the privacy and offline message appears: a calm chip at the foot of the rail.
 * It opens a short explanation with a link to the Privacy page, and changes only when something is actually wrong.
 */
export function PrivacyChip() {
  const [open, setOpen] = useState(false);
  const problem = useGuaranteeProblem();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const Icon = problem ? TriangleAlert : ShieldCheck;
  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        data-testid="privacy-chip"
        className={cn(
          'flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          problem ? 'border-transparent bg-warning text-warning-foreground' : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {problem ? 'Needs a connection' : 'Private, works offline'}
      </button>
      {open && (
        <div id={panelId} role="region" aria-label="About privacy" className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
          {problem && <p className="mb-2 font-medium">{problem}</p>}
          <p className="text-muted-foreground">Everything runs on your device. Nothing you enter leaves it, and after your first visit the Tools you have used keep working offline.</p>
          <Link href="/privacy" onClick={() => setOpen(false)} className="mt-2 inline-block underline underline-offset-2">
            How we guarantee it
          </Link>
        </div>
      )}
    </div>
  );
}
