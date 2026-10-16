/** Uniform random integer in [0, max) from the Web Crypto RNG, using rejection sampling to avoid modulo bias. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError('max must be an integer between 1 and 2^32');
  if (max === 1) return 0;
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0]! < limit) return buf[0]! % max;
  }
}

/** Fisher-Yates shuffle (returns a new array). */
export function shuffled<T>(items: readonly T[], rand: (max: number) => number = randomInt): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
