import { useEffect, useMemo, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react';
import { useLocation } from 'wouter';
import { Search, Sparkles } from 'lucide-react';
import { detectFile, detectText, type DetectKind } from '@/core/detect';
import { TOOLS, toolsForKinds } from '@/core/registry';
import { searchToolsWithMatch } from '@/core/search';
import { setPendingInput } from '@/core/host';
import type { ToolMeta } from '@/core/types';
import { cn } from '@/ui/lib/utils';
import { Button } from '@/ui/shadcn/button';
import { ToolCard } from './ToolCard';

type Detected = { label: string; tools: ToolMeta[]; text?: string; files?: File[] };

const FILE_LABEL: Record<string, string> = {
  pdf: 'PDF',
  image: 'image',
  zip: 'zip archive',
  gzip: 'gzip file',
  tar: 'tar archive',
  video: 'video',
  audio: 'audio file',
  sqlite: 'SQLite database',
  xlsx: 'spreadsheet',
  docx: 'Word document',
  file: 'file',
};

const KIND_LABEL: Record<string, string> = { jwt: 'JWT', json: 'JSON', yaml: 'YAML', xml: 'XML', csv: 'CSV', base64: 'Base64 string', timestamp: 'Unix timestamp', uuid: 'UUID', url: 'URL', cron: 'cron expression', 'pem-cert': 'certificate', html: 'HTML', sql: 'SQL query', curl: 'cURL command', color: 'colour', ip: 'IP address', cidr: 'CIDR range', hex: 'hex string' };

/** Short single-line input is treated as a search; anything else is only offered to Smart Paste. */
const isSearchQuery = (text: string) => text.length > 0 && text.length <= 80 && !text.includes('\n');

/**
 * The home bench: one always-focused surface that is both search and Smart Paste.
 * Type to search Tools (every Tool, whatever the Developer tools switch says); paste or drop content and the
 * matching Tools are suggested, best first. The suggestions stay visible while typing. Content stays in memory only.
 */
export function Bench({ text, onTextChange }: { text: string; onTextChange: (text: string) => void }) {
  const [, navigate] = useLocation();
  const [detected, setDetected] = useState<Detected | null>(null);
  const [over, setOver] = useState(false);
  const query = text.trim();
  const results = useMemo(() => (isSearchQuery(query) ? searchToolsWithMatch(query, TOOLS) : null), [query]);

  // Detect as the user types or pastes (debounced). Short plain words are searches, not data.
  useEffect(() => {
    if (!query) {
      setDetected(null);
      return;
    }
    const t = setTimeout(() => {
      const kinds = query.length >= 6 ? detectText(text).filter((k) => k !== 'text' && k !== 'markdown') : [];
      if (kinds.length) setDetected({ label: KIND_LABEL[kinds[0]!] ?? kinds[0]!, tools: toolsForKinds(kinds).slice(0, 6), text });
      else if (!isSearchQuery(query) && query.length >= 40) setDetected({ label: 'plain text', tools: toolsForKinds(['text']).slice(0, 6), text });
      else setDetected(null);
    }, 150);
    return () => clearTimeout(t);
  }, [text, query]);

  const fromFiles = async (files: File[]) => {
    if (!files.length) return;
    const kind: DetectKind = await detectFile(files[0]!);
    setDetected({ label: FILE_LABEL[kind] ?? kind, tools: toolsForKinds([kind]).slice(0, 6), files });
  };

  const open = (tool: ToolMeta) => {
    setPendingInput(tool.id, { input: detected?.text, files: detected?.files });
    navigate(`/${tool.path}`);
  };

  // Pasted files (e.g. a screenshot) are handled here; pasted text flows through onChange.
  const onPaste = (e: ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      void fromFiles(files);
    }
  };

  // Paste works anywhere on the home page, without focusing the bar first. Pastes into other fields are left alone.
  useEffect(() => {
    const onDocPaste = (e: globalThis.ClipboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || el.closest('[data-testid="home-search"]')) return; // the bar's own handler covers this
      if (el.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      const pasted = e.clipboardData?.getData('text') ?? '';
      if (!files.length && !pasted) return;
      e.preventDefault();
      if (files.length) void fromFiles(files);
      else onTextChange(pasted);
      document.querySelector<HTMLTextAreaElement>('[data-testid="home-search"]')?.focus();
    };
    document.addEventListener('paste', onDocPaste);
    return () => document.removeEventListener('paste', onDocPaste);
  });

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) void fromFiles(files);
    else onTextChange(e.dataTransfer.getData('text'));
  };

  // Enter on a short search opens the best match, like the command palette.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || detected) return;
    const first = results?.[0];
    if (first) {
      e.preventDefault();
      navigate(`/${first.tool.path}`);
    }
  };

  return (
    <section aria-label="Search and Smart Paste" className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn('relative rounded-xl border bg-popover shadow-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30', over && 'border-ring bg-brand/5')}
      >
        <Search className="pointer-events-none absolute top-4 left-4 size-5 text-muted-foreground" />
        <textarea
          autoFocus
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          rows={1}
          spellCheck={false}
          aria-label="Search Tools, or paste anything"
          placeholder="Search Tools, or paste anything: a JWT, JSON, a timestamp, a file…"
          data-testid="home-search"
          className="block max-h-56 min-h-14 w-full resize-none bg-transparent py-4 pr-4 pl-12 font-mono text-sm [field-sizing:content] outline-none placeholder:font-sans placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-2 text-sm" data-testid="smart-paste-result">
        <Sparkles className="size-4 text-brand" aria-hidden />
        {detected ? (
          detected.tools.length ? (
            <>
              <span className="text-muted-foreground">Looks like {detected.label}. Open it in:</span>
              {detected.tools.map((t, i) => (
                <Button key={t.id} size="sm" variant={i === 0 ? 'default' : 'secondary'} onClick={() => open(t)} data-testid={`smart-${t.id}`}>
                  {t.name}
                </Button>
              ))}
            </>
          ) : (
            <span className="text-muted-foreground">That looks like {detected.label}, but no Tool handles it yet. Try searching by name instead.</span>
          )
        ) : (
          <span className="text-muted-foreground">Paste or drop anything and we will point you to the right Tool.</span>
        )}
      </div>

      {results && (
        <div aria-label="Search results" role="region" className="pt-1">
          {results.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <ToolCard key={r.tool.id} tool={r.tool} alias={r.alias} detailed />
              ))}
            </div>
          ) : (
            !detected && <p className="text-sm text-muted-foreground">Nothing called “{query}” yet. Try a shorter word, or paste what you have and we will find a Tool for it.</p>
          )}
        </div>
      )}
    </section>
  );
}
