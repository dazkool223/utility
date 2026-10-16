const IDENT = /^[A-Za-z_$][\w$]*$/;

/** JSONPath-style path for a child key. */
export function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return IDENT.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

export function describe(value: unknown): string {
  if (Array.isArray(value)) return `[${value.length}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).length}}`;
  return JSON.stringify(value);
}

/** Number of nodes in the document (containers and scalars). */
export function countNodes(value: unknown): number {
  if (value && typeof value === 'object') {
    let n = 1;
    for (const c of Object.values(value)) n += countNodes(c);
    return n;
  }
  return 1;
}
