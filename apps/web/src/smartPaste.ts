import { detectText } from '@/core/detect';
import { toolsForKinds } from '@/core/registry';
import type { ToolMeta } from '@/core/types';

export interface Suggestion {
  /** What the content looks like, e.g. "JWT". */
  label: string;
  /** Tools that handle it, best match first. */
  tools: ToolMeta[];
}

const KIND_LABEL: Record<string, string> = { jwt: 'JWT', json: 'JSON', yaml: 'YAML', xml: 'XML', csv: 'CSV', base64: 'Base64 string', timestamp: 'Unix timestamp', uuid: 'UUID', url: 'URL', cron: 'cron expression', 'pem-cert': 'certificate', html: 'HTML', sql: 'SQL query', curl: 'cURL command', color: 'colour', ip: 'IP address', cidr: 'CIDR range', hex: 'hex string' };

// Detection scans the whole text, so very large pastes are not scanned and are offered to the text Tools as they are.
const MAX_SCAN_CHARS = 200_000;

/**
 * Smart Paste for text: what is it, and which Tools handle it? Short plain words are searches, not data, so they get no suggestion.
 * Used by the Quick Launcher; the home bench applies the same rules.
 */
export function suggestForText(text: string): Suggestion | null {
  const query = text.trim();
  if (!query) return null;
  if (text.length > MAX_SCAN_CHARS) return { label: 'a large piece of text', tools: toolsForKinds(['text']).slice(0, 6) };
  const kinds = query.length >= 6 ? detectText(text).filter((k) => k !== 'text' && k !== 'markdown') : [];
  if (kinds.length) return { label: KIND_LABEL[kinds[0]!] ?? kinds[0]!, tools: toolsForKinds(kinds).slice(0, 6) };
  if ((query.includes('\n') || query.length > 80) && query.length >= 40) return { label: 'plain text', tools: toolsForKinds(['text']).slice(0, 6) };
  return null;
}
