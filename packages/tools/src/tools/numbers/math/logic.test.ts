import { describe, expect, it } from 'vitest';
import { evaluateLines, evaluateText } from './logic';

const one = async (e: string) => (await evaluateLines(e))[0]!.result;

describe('evaluateLines', () => {
  it('arithmetic and precedence', async () => {
    expect(await one('2 + 3 * 4')).toBe('14');
    expect(await one('(2 + 3) * 4')).toBe('20');
    expect(await one('2 ^ 10')).toBe('1024');
    expect(await one('10 % 4')).toBe('2');
    expect(await one('7 / 2')).toBe('3.5');
  });
  it('avoids floating-point noise', async () => {
    expect(await one('0.1 + 0.2')).toBe('0.3');
    expect(await one('1 / 3')).toBe('0.33333333333333');
  });
  it('functions and constants', async () => {
    expect(await one('sqrt(16)')).toBe('4');
    expect(await one('sin(pi / 2)')).toBe('1');
    expect(await one('log(e)')).toBe('1');
    expect(await one('factorial(10)')).toBe('3628800');
    expect(await one('round(2.567, 1)')).toBe('2.6');
    expect(await one('max(3, 9, 4)')).toBe('9');
  });
  it('units and conversions', async () => {
    expect(await one('5 inch to cm')).toBe('12.7 cm');
    expect(await one('60 mile/hour to km/hour')).toMatch(/^96\.56/);
  });
  it('shares variables between lines and skips comments', async () => {
    const r = await evaluateLines('# budget\nx = 5\ny = x * 2\nx + y # sum');
    expect(r.map((l) => l.result)).toEqual(['5', '10', '15']);
  });
  it('supports BigNumber precision', async () => {
    const r = await evaluateLines('0.1 + 0.2\n2 ^ 100', 'BigNumber', 40);
    expect(r[0]!.result).toBe('0.3');
    expect(r[1]!.result).toBe('1.267650600228229401496703205376e+30');
  });
  it('supports fractions', async () => {
    expect((await evaluateLines('1/3 + 1/6', 'Fraction'))[0]!.result).toBe('1/2');
  });
  it('matrices and complex numbers', async () => {
    expect(await one('[1, 2; 3, 4] * [5; 6]')).toBe('[[17], [39]]');
    expect(await one('sqrt(-4)')).toBe('2i');
  });
  it('formats with text output', async () => {
    expect(await evaluateText('1 + 1\n2 * 3')).toBe('1 + 1 = 2\n2 * 3 = 6');
  });
});

describe('errors and safety', () => {
  it('names the failing line in plain language', async () => {
    await expect(evaluateLines('1 + 1\n2 +')).rejects.toThrow(/Line 2/);
    await expect(evaluateLines('foo + 1')).rejects.toThrow(/Undefined symbol foo/);
    await expect(evaluateLines('sqrt("a", 2, 3)')).rejects.toThrow(/Line 1/);
    await expect(evaluateLines('')).rejects.toThrow(/Enter an expression/);
    await expect(evaluateLines('# only a comment')).rejects.toThrow(/Enter an expression/);
  });
  it('cannot import code or redefine units from an expression', async () => {
    await expect(evaluateLines('import({x: 1}, {override: true})')).rejects.toThrow(/disabled/);
    await expect(evaluateLines('createUnit("foo", "1 m")')).rejects.toThrow(/disabled/);
  });
  it('does not execute JavaScript', async () => {
    await expect(evaluateLines('constructor.constructor("return 1")()')).rejects.toThrow();
    await expect(evaluateLines('process.exit()')).rejects.toThrow();
  });
});

describe('size guards', () => {
  it.each(['zeros(20000, 20000)', 'ones([5000, 5000])', 'identity(5000)', 'range(1, 100000000)', '1:100000000', '[1:100000000]', 'sum(range("1:100000000"))', 'resize([1], [20000, 20000])', 'kron(zeros(1000, 1000), zeros(1000, 1000))', 'outer(range(1, 900000), range(1, 900000))', 'randomInt(0, 9, [20000, 20000])'])(
    'refuses %s instead of running out of memory',
    async (expr) => {
      await expect(evaluateLines(expr)).rejects.toThrow(/too large for the calculator/);
    },
  );
  it('still allows reasonable sizes', async () => {
    expect(await one('sum(1:1000)')).toBe('499500');
    expect(await one('size(zeros(100, 100))')).toBe('[100, 100]');
    expect(await one('size(identity(50))')).toBe('[50, 50]');
    expect(await one('sum(range(0, 10, 2))')).toBe('20');
  });
});
