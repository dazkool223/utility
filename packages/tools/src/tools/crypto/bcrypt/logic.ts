import { ToolError } from '@/core/types';

export const MIN_COST = 4;
export const MAX_COST = 18;
export const BCRYPT_BYTE_LIMIT = 72;

export const passwordBytes = (pw: string): number => new TextEncoder().encode(pw).length;
export const truncates = (pw: string): boolean => passwordBytes(pw) > BCRYPT_BYTE_LIMIT;

export async function hashPassword(password: string, cost: number): Promise<string> {
  if (!password) throw new ToolError('Enter a password to hash.');
  if (!Number.isInteger(cost) || cost < MIN_COST || cost > MAX_COST) throw new ToolError(`Cost must be a whole number from ${MIN_COST} to ${MAX_COST}.`);
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.hash(password, cost);
}

export const HASH_RE = /^\$2[abxy]?\$(\d{2})\$[./A-Za-z0-9]{53}$/;

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const h = hash.trim();
  if (!HASH_RE.test(h)) throw new ToolError('That is not a bcrypt hash. It should look like $2b$10$ followed by 53 characters.');
  if (!password) throw new ToolError('Enter the password to check.');
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(password, h);
}

export function hashInfo(hash: string): { version: string; cost: number } | null {
  const m = HASH_RE.exec(hash.trim());
  if (!m) return null;
  return { version: hash.trim().slice(1, hash.trim().indexOf('$', 1)), cost: Number(m[1]) };
}
