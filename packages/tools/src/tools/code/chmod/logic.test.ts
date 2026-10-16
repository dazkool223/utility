import { describe, expect, it } from 'vitest';
import { describeChmod, octalOf, parseChmod, symbolicOf, toClauses, toOctal, toSymbolic } from './logic';

describe('parseChmod', () => {
  it('reads octal', () => {
    expect(parseChmod('755')).toBe(0o755);
    expect(parseChmod('0644')).toBe(0o644);
    expect(parseChmod('4755')).toBe(0o4755);
    expect(parseChmod('000')).toBe(0);
  });
  it('reads symbolic strings, with or without a file type', () => {
    expect(parseChmod('rwxr-xr-x')).toBe(0o755);
    expect(parseChmod('-rw-r--r--')).toBe(0o644);
    expect(parseChmod('drwxrwxrwt')).toBe(0o1777);
    expect(parseChmod('rwsr-sr-x')).toBe(0o6755);
    expect(parseChmod('rwSr--r--')).toBe(0o4644);
    expect(parseChmod('rw-r--r-T')).toBe(0o1644);
  });
  it('reads clauses', () => {
    expect(parseChmod('u=rwx,g=rx,o=rx')).toBe(0o755);
    expect(parseChmod('a=r')).toBe(0o444);
    expect(parseChmod('u=rws,go=rx')).toBe(0o4655);
    expect(parseChmod('u=rwxs,go=rx')).toBe(0o4755);
    expect(parseChmod('=rw')).toBe(0o666);
  });
  it('accepts a pasted chmod command', () => {
    expect(parseChmod('chmod 600 secret.key')).toBe(0o600);
    expect(parseChmod('chmod -R 755 dir')).toBe(0o755);
  });
  it('rejects bad input', () => {
    expect(() => parseChmod('')).toThrow('Enter permissions');
    expect(() => parseChmod('789')).toThrow('not valid octal');
    expect(() => parseChmod('75')).toThrow('not valid octal');
    expect(() => parseChmod('77777')).toThrow('not valid octal');
    expect(() => parseChmod('rwxrwxrwz')).toThrow();
    expect(() => parseChmod('xwrxwrxwr')).toThrow();
    expect(() => parseChmod('u+x')).toThrow('Relative changes');
    expect(() => parseChmod('u=rwq')).toThrow('not supported');
    expect(() => parseChmod('rwxrwsrwx')).not.toThrow();
    expect(() => parseChmod('rwxrwxrws')).toThrow('only applies');
    expect(() => parseChmod('hello')).toThrow('Could not read');
  });
});

describe('formatting', () => {
  it('round-trips', () => {
    for (const m of [0, 0o644, 0o755, 0o777, 0o4755, 0o2755, 0o1777, 0o7777]) {
      expect(parseChmod(toOctal(m))).toBe(m);
      expect(parseChmod(toSymbolic(m))).toBe(m);
      expect(parseChmod(toClauses(m))).toBe(m);
    }
  });
  it('writes octal and symbolic', () => {
    expect(toOctal(0o644)).toBe('644');
    expect(toOctal(0o4755)).toBe('4755');
    expect(toSymbolic(0o4755)).toBe('rwsr-xr-x');
    expect(toSymbolic(0o1666)).toBe('rw-rw-rwT');
    expect(toClauses(0o640)).toBe('u=rw,g=r,o=');
    expect(octalOf('rwxr-x---')).toBe('750');
    expect(symbolicOf('700')).toBe('rwx------');
  });
  it('describes', () => {
    const out = describeChmod('755');
    expect(out).toContain('Octal:     755');
    expect(out).toContain('Owner (u): read, write, execute');
    expect(out).toContain('Others (o): read, execute');
    expect(out).toContain('chmod u=rwx,g=rx,o=rx file');
    expect(describeChmod('1777')).toContain('sticky');
    expect(describeChmod('000')).toContain('Owner (u): no access');
  });
});
