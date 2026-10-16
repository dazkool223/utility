import { ToolError } from '@/core/types';

/** Permission bits, e.g. 0o755. Bits 0o4000 setuid, 0o2000 setgid, 0o1000 sticky. */
export type Mode = number;

const WHO = ['u', 'g', 'o'] as const;
const NAMES = ['read', 'write', 'execute'] as const;

/** Read octal ("755", "0755", "4755"), symbolic ("rwxr-xr-x", "-rwxr-xr-x") or "u=rwx,g=rx,o=rx" into a mode. */
export function parseChmod(input: string): Mode {
  const t = input.trim().replace(/^chmod\s+(-[A-Za-z]+\s+)*/, '').split(/\s+/)[0] ?? '';
  if (!t) throw new ToolError('Enter permissions such as 755, rwxr-xr-x or u=rwx,g=rx,o=rx.');
  if (/^[0-9]+$/.test(t)) {
    if (!/^[0-7]{3,4}$/.test(t)) throw new ToolError(`"${t}" is not valid octal permissions. Use three or four digits from 0 to 7, such as 755 or 4755.`);
    return parseInt(t, 8);
  }
  if (/^[-dlcbps]?[-rwxsStT]{9}$/.test(t)) return parseSymbolicString(t.length === 10 ? t.slice(1) : t);
  if (/^[ugoa]*[=+-]/.test(t)) return parseClauses(t);
  throw new ToolError(`Could not read "${t}" as permissions. Try 755, rwxr-xr-x or u=rwx,g=rx,o=rx.`);
}

function parseSymbolicString(s: string): Mode {
  let mode = 0;
  for (let i = 0; i < 3; i++) {
    const [r, w, x] = [s[i * 3]!, s[i * 3 + 1]!, s[i * 3 + 2]!];
    if (!'r-'.includes(r) || !'w-'.includes(w)) throw new ToolError(`"${s}" is not a valid permission string: expected r and w in the read and write positions.`);
    let bits = (r === 'r' ? 4 : 0) | (w === 'w' ? 2 : 0);
    if (x === 'x') bits |= 1;
    else if (x === 's' || x === 't') {
      bits |= 1;
      mode |= i === 0 ? 0o4000 : i === 1 ? 0o2000 : 0o1000;
    } else if (x === 'S' || x === 'T') mode |= i === 0 ? 0o4000 : i === 1 ? 0o2000 : 0o1000;
    if ((x === 's' || x === 'S') && i === 2) throw new ToolError('s only applies to the owner and group columns. Use t for the sticky bit in the others column.');
    if ((x === 't' || x === 'T') && i !== 2) throw new ToolError('t (sticky) only applies to the last column.');
    mode |= bits << ((2 - i) * 3);
  }
  return mode;
}

function parseClauses(t: string): Mode {
  let mode = 0;
  for (const clause of t.split(',')) {
    const m = /^([ugoa]*)([=+-])([a-zA-Z]*)$/.exec(clause);
    if (!m) throw new ToolError(`Could not read "${clause}". Clauses look like u=rwx, g=rx or a=r.`);
    if (m[2] !== '=') throw new ToolError('Relative changes (+ and -) depend on the permissions a file already has. Use = to set exact permissions, for example u=rwx,g=rx,o=rx.');
    const who = m[1] ? (m[1].includes('a') ? 'ugo' : m[1]) : 'ugo';
    let perm = 0;
    for (const c of m[3]!) {
      if (c === 'r') perm |= 4;
      else if (c === 'w') perm |= 2;
      else if (c === 'x') perm |= 1;
      else if (c !== 's' && c !== 't') throw new ToolError(`The permission "${c}" is not supported here. Use r, w, x, s or t.`);
    }
    for (const w of who) {
      const shift = (2 - WHO.indexOf(w as 'u')) * 3;
      mode = (mode & ~(7 << shift)) | (perm << shift);
      if (m[3]!.includes('s') && w === 'u') mode |= 0o4000;
      if (m[3]!.includes('s') && w === 'g') mode |= 0o2000;
      if (m[3]!.includes('t')) mode |= 0o1000;
    }
  }
  return mode;
}

export function toOctal(mode: Mode): string {
  return (mode & 0o7000 ? (mode >> 9).toString(8) : '') + [6, 3, 0].map((s) => ((mode >> s) & 7).toString(8)).join('');
}

export function toSymbolic(mode: Mode): string {
  let out = '';
  for (let i = 0; i < 3; i++) {
    const bits = (mode >> ((2 - i) * 3)) & 7;
    const special = i === 0 ? mode & 0o4000 : i === 1 ? mode & 0o2000 : mode & 0o1000;
    const x = bits & 1;
    const xc = special ? (i === 2 ? (x ? 't' : 'T') : x ? 's' : 'S') : x ? 'x' : '-';
    out += (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + xc;
  }
  return out;
}

/** The "u=rwx,g=rx,o=rx" form, with s and t where special bits are set. */
export function toClauses(mode: Mode): string {
  return WHO.map((w, i) => {
    const bits = (mode >> ((2 - i) * 3)) & 7;
    const special = i === 0 ? mode & 0o4000 : i === 1 ? mode & 0o2000 : mode & 0o1000;
    return `${w}=${bits & 4 ? 'r' : ''}${bits & 2 ? 'w' : ''}${bits & 1 ? 'x' : ''}${special ? (i === 2 ? 't' : 's') : ''}`;
  }).join(',');
}

function words(bits: number): string {
  const list = NAMES.filter((_, i) => bits & (4 >> i));
  return list.length ? list.join(', ') : 'no access';
}

export function describeChmod(input: string): string {
  const mode = parseChmod(input);
  const oct = toOctal(mode);
  const sym = toSymbolic(mode);
  const special = [mode & 0o4000 ? 'setuid (runs as the file owner)' : '', mode & 0o2000 ? 'setgid (runs as the file group, or new files inherit the directory group)' : '', mode & 0o1000 ? 'sticky (only owners can delete files in a directory)' : ''].filter(Boolean);
  return [
    `Octal:     ${oct}`,
    `Symbolic:  ${sym}`,
    `ls -l:     -${sym} (file), d${sym} (directory)`,
    '',
    `Owner (u): ${words((mode >> 6) & 7)}`,
    `Group (g): ${words((mode >> 3) & 7)}`,
    `Others (o): ${words(mode & 7)}`,
    `Special:   ${special.length ? special.join('; ') : 'none'}`,
    '',
    `chmod ${oct} file`,
    `chmod ${toClauses(mode)} file`,
  ].join('\n');
}

export const octalOf = (input: string): string => toOctal(parseChmod(input));
export const symbolicOf = (input: string): string => toSymbolic(parseChmod(input));
