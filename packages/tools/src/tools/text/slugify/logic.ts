import slugify from '@sindresorhus/slugify';

export interface SlugOptions {
  separator: string;
  lowercase: boolean;
  decamelize: boolean;
}

export const DEFAULT_SLUG: SlugOptions = { separator: '-', lowercase: true, decamelize: true };

/** Slugify each line separately. Accented letters are transliterated (é becomes e, ß becomes ss). */
export function slugifyLines(input: string, o: SlugOptions): string {
  return input
    .split('\n')
    .map((line) => (line.trim() ? slugify(line, { separator: o.separator || '-', lowercase: o.lowercase, decamelize: o.decamelize }) : ''))
    .join('\n');
}
