import { useId } from 'react';
import { Label } from '@/ui/shadcn/label';
import { Switch } from '@/ui/shadcn/switch';
import { useDeveloperTools } from '../audience';

/** Reveals developer Tools in browsing views. Search, Smart Paste, Favourites, Recents and direct links ignore it. */
export function DeveloperToggle() {
  const id = useId();
  const [on, setOn] = useDeveloperTools();
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={on} onCheckedChange={setOn} />
      <Label htmlFor={id} className="font-normal">
        Developer tools
      </Label>
    </div>
  );
}
