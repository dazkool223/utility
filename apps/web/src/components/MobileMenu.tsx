import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/ui/shadcn/dialog';
import { Rail } from './Rail';

/** Narrow screens: the rail's contents in a slide-in menu. Loaded on first open to keep the app shell small. */
export function MobileMenu({ open, onOpenChange, onOpenPalette }: { open: boolean; onOpenChange: (open: boolean) => void; onOpenPalette: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 left-0 h-svh w-[85vw] max-w-80 translate-x-0 translate-y-0 content-start gap-0 overflow-y-auto rounded-none p-0 sm:max-w-80">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <DialogDescription className="sr-only">Browse Categories, Favourites and Recent Tools.</DialogDescription>
        <div className="h-svh pt-10">
          <Rail
            onNavigate={() => onOpenChange(false)}
            onOpenPalette={() => {
              onOpenChange(false);
              onOpenPalette();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
