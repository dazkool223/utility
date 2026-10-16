import { useCallback, useEffect, useState } from 'react';
import { GeneratorTool, NumberInput, OptionsBar, Select, TextInput } from '@/ui';
import { MAX_COUNT, MAX_SIZE, generateTokens, type TokenKind } from './logic';

const KINDS: Array<{ value: TokenKind; label: string }> = [
  { value: 'nanoid', label: 'nanoid (A-Za-z0-9_-)' },
  { value: 'alphanumeric', label: 'Alphanumeric (A-Za-z0-9)' },
  { value: 'lowercase', label: 'Lowercase + digits' },
  { value: 'numeric', label: 'Digits only' },
  { value: 'custom', label: 'Custom alphabet' },
  { value: 'hex', label: 'Random bytes as hex' },
  { value: 'base64', label: 'Random bytes as Base64' },
  { value: 'base64url', label: 'Random bytes as Base64URL' },
];

export default function NanoidTool() {
  const [kind, setKind] = useState<TokenKind>('nanoid');
  const [size, setSize] = useState(21);
  const [alphabet, setAlphabet] = useState('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  const [count, setCount] = useState(1);
  const [bits, setBits] = useState<number | null>(null);
  const bytesKind = kind === 'hex' || kind === 'base64' || kind === 'base64url';

  useEffect(() => {
    setSize(bytesKind ? 32 : 21);
  }, [bytesKind]);

  const generate = useCallback(async () => {
    const r = await generateTokens({ kind, size, alphabet, count });
    setBits(r.entropyBits);
    return r.tokens.join('\n');
  }, [kind, size, alphabet, count]);

  return (
    <GeneratorTool
      generate={generate}
      filename="tokens.txt"
      options={
        <OptionsBar>
          <Select label="Format" value={kind} onChange={setKind} options={KINDS} />
          <NumberInput label={bytesKind ? 'Bytes' : 'Length'} value={size} onChange={setSize} min={1} max={MAX_SIZE} />
          {kind === 'custom' && <TextInput label="Alphabet" value={alphabet} onChange={setAlphabet} monospace className="w-72" />}
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
          {bits !== null && <p className="m-0 pb-1.5 text-sm">{Math.floor(bits)} bits of entropy</p>}
        </OptionsBar>
      }
    />
  );
}
