import { useMemo, useState } from 'react';
import { copyText, TextInput } from '@/ui';
import { filterSections } from './logic';

export default function RegexCheatsheet() {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => filterSections(query), [query]);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (token: string) => {
    const first = token.split('  ')[0]!;
    if (await copyText(first)) {
      setCopied(token);
      setTimeout(() => setCopied(null), 1200);
    }
  };
  return (
    <div className="flex flex-col gap-4" data-testid="tool-output">
      <TextInput label="Search the cheatsheet" value={query} onChange={setQuery} placeholder="lookahead, word boundary, \d…" testId="cheatsheet-search" className="w-96 max-w-full" />
      {sections.length === 0 && <p className="m-0 text-sm text-muted-foreground">Nothing matches that search.</p>}
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-1">
          <h2 className="m-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{s.title}</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <tbody>
                {s.entries.map((e) => (
                  <tr key={e.token} className="border-b align-top last:border-0">
                    <td className="w-2/5 px-3 py-2">
                      <button type="button" className="cursor-pointer text-left font-mono font-semibold break-all" title="Click to copy" onClick={() => void copy(e.token)}>
                        {e.token}
                      </button>
                      {copied === e.token && <span className="ml-2 text-xs text-brand">copied</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div>{e.meaning}</div>
                      {e.example && <div className="font-mono text-xs text-muted-foreground">{e.example}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
