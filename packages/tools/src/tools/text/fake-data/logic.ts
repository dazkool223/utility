import Papa from 'papaparse';
import { ToolError } from '@/core/types';

type Faker = (typeof import('@faker-js/faker/locale/en'))['faker'];

export const FIELDS: Record<string, (f: Faker) => string | number | boolean> = {
  name: (f) => f.person.fullName(),
  firstName: (f) => f.person.firstName(),
  lastName: (f) => f.person.lastName(),
  email: (f) => f.internet.email().toLowerCase(),
  username: (f) => f.internet.username(),
  password: (f) => f.internet.password({ length: 14 }),
  phone: (f) => f.phone.number(),
  address: (f) => f.location.streetAddress(),
  city: (f) => f.location.city(),
  state: (f) => f.location.state(),
  zip: (f) => f.location.zipCode(),
  country: (f) => f.location.country(),
  latitude: (f) => f.location.latitude(),
  longitude: (f) => f.location.longitude(),
  company: (f) => f.company.name(),
  jobTitle: (f) => f.person.jobTitle(),
  product: (f) => f.commerce.productName(),
  price: (f) => f.commerce.price(),
  color: (f) => f.color.human(),
  uuid: (f) => f.string.uuid(),
  number: (f) => f.number.int({ min: 0, max: 1000 }),
  boolean: (f) => f.datatype.boolean(),
  date: (f) => f.date.past({ years: 5 }).toISOString(),
  birthdate: (f) => f.date.birthdate().toISOString().slice(0, 10),
  ip: (f) => f.internet.ipv4(),
  url: (f) => f.internet.url(),
  word: (f) => f.lorem.word(),
  sentence: (f) => f.lorem.sentence(),
  paragraph: (f) => f.lorem.paragraph(),
};

export type FakeFormat = 'json' | 'ndjson' | 'csv' | 'lines';

export interface FakeOptions {
  fields: readonly string[];
  count: number;
  format: FakeFormat;
}

export const MAX_ROWS = 10_000;

export function parseFieldList(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Generate fake records with Faker (English locale only). The Faker seed comes from the crypto RNG. */
export async function generateFake(o: FakeOptions): Promise<string> {
  const unknown = o.fields.filter((f) => !FIELDS[f]);
  if (!o.fields.length) throw new ToolError('Choose at least one field, for example: name, email, city.');
  if (unknown.length) throw new ToolError(`Unknown field${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Available: ${Object.keys(FIELDS).join(', ')}.`);
  const { faker } = await import('@faker-js/faker/locale/en');
  faker.seed(crypto.getRandomValues(new Uint32Array(1))[0]!);
  const n = Math.max(1, Math.min(MAX_ROWS, Math.floor(o.count) || 1));
  const rows = Array.from({ length: n }, () => Object.fromEntries(o.fields.map((f) => [f, FIELDS[f]!(faker)])));
  switch (o.format) {
    case 'json':
      return JSON.stringify(rows, null, 2);
    case 'ndjson':
      return rows.map((r) => JSON.stringify(r)).join('\n');
    case 'csv':
      return Papa.unparse({ fields: o.fields, data: rows.map((r) => o.fields.map((f) => r[f]!)) }, { newline: '\n' });
    default:
      return rows.map((r) => o.fields.map((f) => String(r[f])).join(' | ')).join('\n');
  }
}
