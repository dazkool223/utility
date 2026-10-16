import { useState } from 'react';
import { Field } from '@/ui';
import { Input } from '@/ui/shadcn/input';

/** Masked text field with a show/hide toggle. Value is held in component state only, never stored. */
export function PasswordInput({ label, value, onChange, testId, className }: { label: string; value: string; onChange: (v: string) => void; testId?: string; className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type={show ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            className={className ?? 'h-8 w-56'}
            value={value}
            data-testid={testId}
            onChange={(e) => onChange(e.target.value)}
          />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show
          </label>
        </div>
      )}
    </Field>
  );
}
