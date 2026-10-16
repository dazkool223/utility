import { useCallback, useEffect, useState } from 'react';
import { Checkbox, GeneratorTool, NumberInput, OptionsBar, Segmented, TextInput } from '@/ui';
import { entropyLabel, generatePassphrases, generatePasswords, loadWordlist, MAX_COUNT, MAX_LENGTH, passwordEntropy } from './logic';

export default function PasswordTool() {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [ambiguous, setAmbiguous] = useState(false);
  const [exclude, setExclude] = useState('');
  const [count, setCount] = useState(1);
  const [words, setWords] = useState(5);
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(false);
  const [addNumber, setAddNumber] = useState(false);
  const [wordlist, setWordlist] = useState<readonly string[] | null>(null);

  useEffect(() => {
    if (mode === 'passphrase' && !wordlist) void loadWordlist().then(setWordlist);
  }, [mode, wordlist]);

  const generate = useCallback(() => {
    const batch =
      mode === 'password'
        ? generatePasswords({ length, lower, upper, digits, symbols, excludeAmbiguous: ambiguous, exclude, count })
        : generatePassphrases({ words, separator, capitalize, addNumber, count }, wordlist ?? []);
    return batch.passwords.join('\n');
  }, [mode, length, lower, upper, digits, symbols, ambiguous, exclude, count, words, separator, capitalize, addNumber, wordlist]);

  const bits =
    mode === 'password'
      ? passwordEntropy({ length, lower, upper, digits, symbols, excludeAmbiguous: ambiguous, exclude })
      : words * Math.log2(wordlist?.length ?? 7776) + (addNumber ? Math.log2(100) : 0);

  return (
    <GeneratorTool
      generate={generate}
      filename="passwords.txt"
      options={
        <OptionsBar>
          <Segmented
            label="Type"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'password', label: 'Password' },
              { value: 'passphrase', label: 'Passphrase' },
            ]}
          />
          {mode === 'password' ? (
            <>
              <NumberInput label="Length" value={length} onChange={setLength} min={1} max={MAX_LENGTH} />
              <Checkbox label="a-z" checked={lower} onChange={setLower} />
              <Checkbox label="A-Z" checked={upper} onChange={setUpper} />
              <Checkbox label="0-9" checked={digits} onChange={setDigits} />
              <Checkbox label="Symbols" checked={symbols} onChange={setSymbols} />
              <Checkbox label="Exclude ambiguous (Il1O0o|)" checked={ambiguous} onChange={setAmbiguous} />
              <TextInput label="Also exclude" value={exclude} onChange={setExclude} monospace className="w-32" />
            </>
          ) : (
            <>
              <NumberInput label="Words" value={words} onChange={setWords} min={1} max={50} />
              <TextInput label="Separator" value={separator} onChange={setSeparator} monospace className="w-20" />
              <Checkbox label="Capitalise" checked={capitalize} onChange={setCapitalize} />
              <Checkbox label="Add a number" checked={addNumber} onChange={setAddNumber} />
            </>
          )}
          <NumberInput label="How many" value={count} onChange={setCount} min={1} max={MAX_COUNT} />
          <p className="m-0 pb-1.5 text-sm" data-testid="entropy">
            {Math.floor(bits)} bits of entropy ({entropyLabel(bits)})
          </p>
        </OptionsBar>
      }
    />
  );
}
