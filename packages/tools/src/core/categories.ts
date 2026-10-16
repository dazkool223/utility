import type { CategoryId } from './types';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'json', name: 'JSON', description: 'Format, validate, convert and query JSON' },
  { id: 'formats', name: 'YAML, XML, TOML & CSV', description: 'Convert and validate data formats' },
  { id: 'encoders', name: 'Encoders & Decoders', description: 'Base64, URL, JWT, escaping and more' },
  { id: 'crypto', name: 'Hashing & Crypto', description: 'Hashes, keys, certificates, IDs and passwords' },
  { id: 'text', name: 'Text', description: 'Diff, regex, case, cleanup and generators' },
  { id: 'time', name: 'Date & Time', description: 'Timestamps, cron, time zones and durations' },
  { id: 'web', name: 'Web & HTTP', description: 'URLs, user agents, headers and cURL' },
  { id: 'network', name: 'Network', description: 'Subnets, IP addresses and MAC addresses' },
  { id: 'code', name: 'Code', description: 'Formatters, minifiers and Markdown' },
  { id: 'numbers', name: 'Numbers & Colour', description: 'Bases, units, colours and QR codes' },
  { id: 'images', name: 'Images', description: 'Convert, compress, resize and edit images' },
  { id: 'pdf', name: 'PDF', description: 'Merge, split, protect and convert PDFs' },
  { id: 'office', name: 'Office & Documents', description: 'Spreadsheets, documents and databases' },
  { id: 'media', name: 'Audio & Video', description: 'Convert, trim and inspect media' },
  { id: 'archives', name: 'Archives', description: 'Zip, tar and gzip' },
  { id: 'binary', name: 'Binary & Forensics', description: 'Inspect bytes and decode unknown data' },
];

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}
