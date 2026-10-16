import { getTool } from '../core/registry';
import { sendTo } from '../core/host';
import { useToolMeta } from './context';
import { NativeSelect, NativeSelectOption } from './shadcn/native-select';

/** "Send to…" menu: open a related Tool with `text` as its Tool Input. Renders nothing if there are no related Tools. */
export function SendTo({ text }: { text: string }) {
  const meta = useToolMeta();
  const targets = (meta?.related ?? []).map(getTool).filter((t) => t !== undefined);
  if (!targets.length) return null;
  return (
    <NativeSelect
      size="sm"
      aria-label="Send output to another Tool"
      value=""
      disabled={!text}
      onChange={(e) => {
        if (e.target.value) sendTo(e.target.value, text);
      }}
    >
      <NativeSelectOption value="">Send to…</NativeSelectOption>
      {targets.map((t) => (
        <NativeSelectOption key={t.id} value={t.id}>
          {t.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
