import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { NumberInput, OptionsBar, RestrictionNotice, TextInput, TextTransform, useWorker, type TransformMode } from '@/ui';
import { BCRYPT_BYTE_LIMIT, MAX_COST, MIN_COST, hashInfo, passwordBytes } from './logic';

export default function BcryptTool({ initialInput }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [cost, setCost] = useState(10);
  const [hash, setHash] = useState('');
  const [bytes, setBytes] = useState(initialInput ? passwordBytes(initialInput) : 0);

  const modes = useMemo<TransformMode[]>(
    () => [
      {
        id: 'hash',
        label: 'Hash',
        filename: 'bcrypt.txt',
        run: (pw) => {
          setBytes(passwordBytes(pw));
          return api().hash(pw, cost);
        },
      },
      {
        id: 'compare',
        label: 'Compare',
        run: async (pw) => {
          setBytes(passwordBytes(pw));
          const ok = await api().compare(pw, hash);
          const info = hashInfo(hash);
          return ok ? `Match: the password fits this hash (bcrypt ${info?.version}, cost ${info?.cost}).` : 'No match: the password does not fit this hash.';
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cost, hash],
  );

  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      inputPlaceholder="Password…"
      live={cost <= 10}
      options={
        <>
          <OptionsBar>
            <NumberInput label="Cost (hash mode)" value={cost} onChange={setCost} min={MIN_COST} max={MAX_COST} />
            <TextInput label="Hash to compare against (compare mode)" value={hash} onChange={setHash} monospace className="w-96" testId="bcrypt-hash" />
          </OptionsBar>
          {cost > 10 && <RestrictionNotice>Cost {cost} is slow, so it runs only when you press Run (Ctrl/⌘ Enter).</RestrictionNotice>}
          {bytes > BCRYPT_BYTE_LIMIT && <RestrictionNotice essential>This password is {bytes} bytes. bcrypt only uses the first {BCRYPT_BYTE_LIMIT} bytes, so everything after that is ignored.</RestrictionNotice>}
        </>
      }
    />
  );
}
