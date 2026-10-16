import { useEffect, useState, type ClipboardEvent, type DragEvent } from 'react';
import { useLocation } from 'wouter';
import { ClipboardPaste, Sparkles } from 'lucide-react';
import { detectFile, detectText, type DetectKind } from '@/core/detect';
import { toolsForKinds } from '@/core/registry';
import { setPendingInput } from '@/core/host';
import type { ToolMeta } from '@/core/types';
import { cn } from '@/ui/lib/utils';
import { Button } from '@/ui/shadcn/button';

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

/**
 * Smart Paste (home page): paste text or drop a file; we recognise it locally and suggest Tools.
 * The content is handed to the chosen Tool in memory only.
 */
export function SmartPaste() {
  const [, navigate] = useLocation();
  const [detected, setDetected] = useState<Detected | null>(null);
  const [over, setOver] = useState(false);
  const [text, setText] = useState('');

  // Detect as the user types or pastes (debounced). The text stays in memory only.
  useEffect(() => {
    if (!text.trim()) {
      setDetected(null);
      return;
    }
    const t = setTimeout(() => fromText(text), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const fromText = (text: string) => {
    if (!text.trim()) return;
    const kinds = detectText(text).filter((k) => k !== 'text');
    const tools = toolsForKinds(kinds.length ? kinds : ['text']).slice(0, 6);
    setDetected({ label: kinds[0] ? labelFor(kinds[0]) : 'plain text', tools, text });
  };

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

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) void fromFiles(files);
    else setText(e.dataTransfer.getData('text'));
  };

  return (
    <section aria-label="Smart Paste" className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed bg-card transition-colors focus-within:border-brand',
          over && 'border-brand bg-brand/5',
        )}
      >
        <ClipboardPaste className="pointer-events-none absolute top-4 left-4 size-5 text-muted-foreground" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          rows={2}
          spellCheck={false}
          aria-label="Paste anything here or drop a file to find the right Tool"
          placeholder="Paste anything (a JWT, JSON, a timestamp, a cron expression…) or drop a file, and we'll suggest the right Tool. Nothing leaves your device."
          data-testid="smart-paste"
          className="block w-full resize-none bg-transparent py-3.5 pr-4 pl-12 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground"
        />
      </div>
      {detected && (
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="smart-paste-result">
          <Sparkles className="size-4 text-brand" />
          {detected.tools.length ? (
            <>
              <span className="text-muted-foreground">Detected {detected.label}. Open in:</span>
              {detected.tools.map((t) => (
                <Button key={t.id} size="sm" variant="secondary" onClick={() => open(t)} data-testid={`smart-${t.id}`}>
                  {t.name}
                </Button>
              ))}
            </>
          ) : (
            <span className="text-muted-foreground">Detected {detected.label}, but no Tool handles it yet. Try searching instead.</span>
          )}
        </div>
      )}
    </section>
  );
}

function labelFor(kind: string): string {
  const map: Record<string, string> = { jwt: 'JWT', json: 'JSON', yaml: 'YAML', xml: 'XML', csv: 'CSV', base64: 'Base64 string', timestamp: 'Unix timestamp', uuid: 'UUID', url: 'URL', cron: 'cron expression', 'pem-cert': 'certificate', html: 'HTML', sql: 'SQL query', curl: 'cURL command', color: 'colour', ip: 'IP address', cidr: 'CIDR range', hex: 'hex string' };
  return map[kind] ?? kind;
}
