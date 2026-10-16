import { Archive, ArrowLeftRight, Binary, Braces, Calculator, Clapperboard, Clock, Code, FileSpreadsheet, FileText, Globe, Image, KeyRound, Network, Table2, Type, type LucideIcon } from 'lucide-react';
import type { CategoryId } from './types';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** The one icon for this Category. Tools have no icons of their own. */
  icon: LucideIcon;
  /** OKLCH hue (degrees). Lightness and chroma are shared theme tokens (--cat-l, --cat-c), so no Category looks louder than another. */
  hue: number;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'json', name: 'JSON', description: 'Format, validate, convert and query JSON', icon: Braces, hue: 0 },
  { id: 'formats', name: 'YAML, XML, TOML & CSV', description: 'Convert and validate data formats', icon: Table2, hue: 157.5 },
  { id: 'encoders', name: 'Encoders & Decoders', description: 'Base64, URL, JWT, escaping and more', icon: ArrowLeftRight, hue: 315 },
  { id: 'crypto', name: 'Hashing & Crypto', description: 'Hashes, keys, certificates, IDs and passwords', icon: KeyRound, hue: 112.5 },
  { id: 'text', name: 'Text', description: 'Diff, regex, case, cleanup and generators', icon: Type, hue: 270 },
  { id: 'time', name: 'Date & Time', description: 'Timestamps, cron, time zones and durations', icon: Clock, hue: 67.5 },
  { id: 'web', name: 'Web & HTTP', description: 'URLs, user agents, headers and cURL', icon: Globe, hue: 225 },
  { id: 'network', name: 'Network', description: 'Subnets, IP addresses and MAC addresses', icon: Network, hue: 22.5 },
  { id: 'code', name: 'Code', description: 'Formatters, minifiers and Markdown', icon: Code, hue: 180 },
  { id: 'numbers', name: 'Numbers & Colour', description: 'Bases, units, colours and QR codes', icon: Calculator, hue: 337.5 },
  { id: 'images', name: 'Images', description: 'Convert, compress, resize and edit images', icon: Image, hue: 135 },
  { id: 'pdf', name: 'PDF', description: 'Merge, split, protect and convert PDFs', icon: FileText, hue: 292.5 },
  { id: 'office', name: 'Office & Documents', description: 'Spreadsheets, documents and databases', icon: FileSpreadsheet, hue: 90 },
  { id: 'media', name: 'Audio & Video', description: 'Convert, trim and inspect media', icon: Clapperboard, hue: 247.5 },
  { id: 'archives', name: 'Archives', description: 'Zip, tar and gzip', icon: Archive, hue: 45 },
  { id: 'binary', name: 'Binary & Forensics', description: 'Inspect bytes and decode unknown data', icon: Binary, hue: 202.5 },
];

/** CSS colour for a Category, read from its hue and the theme's shared lightness and chroma. */
export function categoryColour(id: CategoryId): string {
  const hue = CATEGORIES.find((c) => c.id === id)?.hue ?? 0;
  return `oklch(var(--cat-l) var(--cat-c) ${hue})`;
}

export function categoryIcon(id: CategoryId): LucideIcon {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? Code;
}

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}
