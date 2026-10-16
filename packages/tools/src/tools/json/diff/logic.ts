import { create } from 'jsondiffpatch';
import { ToolError } from '@/core/types';
import { parseJson } from '../format/logic';
import { childPath } from '../tree/logic';

export interface Change {
  kind: 'added' | 'removed' | 'changed' | 'moved';
  path: string;
  before?: unknown;
  after?: unknown;
}

const differ = create({ arrays: { detectMove: false } });
const show = (v: unknown) => (v === undefined ? 'undefined' : JSON.stringify(v));

function walk(delta: unknown, path: string, out: Change[]): void {
  if (Array.isArray(delta)) {
    if (delta.length === 1) out.push({ kind: 'added', path, after: delta[0] });
    else if (delta.length === 2) out.push({ kind: 'changed', path, before: delta[0], after: delta[1] });
    else if (delta[2] === 0) out.push({ kind: 'removed', path, before: delta[0] });
    else if (delta[2] === 2) out.push({ kind: 'changed', path, before: '(text)', after: '(text edited)' });
    else if (delta[2] === 3) out.push({ kind: 'moved', path, after: delta[1] });
    return;
  }
  if (!delta || typeof delta !== 'object') return;
  const d = delta as Record<string, unknown>;
  const isArr = d._t === 'a';
  for (const k of Object.keys(d)) {
    if (k === '_t') continue;
    if (isArr) {
      const removed = k.startsWith('_');
      const idx = Number(removed ? k.slice(1) : k);
      const sub = d[k];
      if (removed) out.push({ kind: 'removed', path: childPath(path, idx), before: (sub as unknown[])[0] });
      else walk(sub, childPath(path, idx), out);
    } else walk(d[k], childPath(path, k), out);
  }
}

export function diffJson(a: string, b: string): Change[] {
  if (!a.trim() && !b.trim()) return [];
  const left = a.trim() ? parseJson(a) : undefined;
  const right = b.trim() ? parseJson(b) : undefined;
  if (left === undefined) return [{ kind: 'added', path: '$', after: right }];
  if (right === undefined) return [{ kind: 'removed', path: '$', before: left }];
  const delta = differ.diff(left, right);
  const out: Change[] = [];
  if (delta === undefined) return out;
  try {
    walk(delta, '$', out);
  } catch {
    throw new ToolError('The two documents could not be compared.');
  }
  return out;
}

export function formatChanges(changes: Change[]): string {
  if (!changes.length) return 'No differences';
  return changes
    .map((c) => {
      if (c.kind === 'added') return `+ ${c.path}: ${show(c.after)}`;
      if (c.kind === 'removed') return `- ${c.path}: ${show(c.before)}`;
      if (c.kind === 'moved') return `> ${c.path}: moved to index ${String(c.after)}`;
      return `~ ${c.path}: ${show(c.before)} -> ${show(c.after)}`;
    })
    .join('\n');
}
