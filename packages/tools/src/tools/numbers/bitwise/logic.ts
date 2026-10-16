import { ToolError } from '@/core/types';

export type Width = 8 | 16 | 32 | 64;

type Token = { t: 'num'; v: bigint } | { t: 'op'; v: string } | { t: 'id'; v: string } | { t: 'end' };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const num = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*)/.exec(src.slice(i));
    if (num) {
      const text = num[0].replace(/_/g, '');
      if (/^0[xXbBoO]$/.test(text)) throw new ToolError(`"${num[0]}" has no digits after the prefix.`);
      out.push({ t: 'num', v: BigInt(text) });
      i += num[0].length;
      if (/[A-Za-z0-9]/.test(src[i] ?? '')) throw new ToolError(`"${src.slice(i - num[0].length, i + 1)}" is not a valid number.`);
      continue;
    }
    const op = /^(<<|>>>|>>|[-+*/%&|^~(),])/.exec(src.slice(i));
    if (op) {
      out.push({ t: 'op', v: op[0] });
      i += op[0].length;
      continue;
    }
    const id = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (id) {
      out.push({ t: 'id', v: id[0].toLowerCase() });
      i += id[0].length;
      continue;
    }
    throw new ToolError(`Unexpected character "${ch}". Use numbers (255, 0xFF, 0b1010, 0o17), the operators & | ^ ~ << >> >>> + - * / %, parentheses, and rol(x, n) / ror(x, n).`);
  }
  out.push({ t: 'end' });
  return out;
}

export interface BitwiseResult {
  unsigned: bigint;
  signed: bigint;
  width: Width;
  hex: string;
  binary: string;
  octal: string;
  popcount: number;
  leadingZeros: number;
  trailingZeros: number;
  setBits: number[];
  byteSwapped: string;
}

export function evaluateBitwise(expression: string, width: Width = 32): BitwiseResult {
  const src = expression.trim();
  if (!src) throw new ToolError('Enter an expression, such as 0xFF & 0x0F or 1 << 4.');
  const W = BigInt(width);
  const mask = (1n << W) - 1n;
  const wrap = (x: bigint) => x & mask;
  const signed = (x: bigint) => (wrap(x) >= 1n << (W - 1n) ? wrap(x) - (1n << W) : wrap(x));
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos]!;
  const isOp = (...ops: string[]) => peek().t === 'op' && ops.includes((peek() as { v: string }).v);
  const take = () => tokens[pos++]!;

  const shiftCount = (n: bigint): bigint => {
    if (n < 0n) throw new ToolError('Shift counts cannot be negative.');
    return n;
  };

  function parseOr(): bigint {
    let a = parseXor();
    while (isOp('|')) {
      take();
      a = wrap(a | parseXor());
    }
    return a;
  }
  function parseXor(): bigint {
    let a = parseAnd();
    while (isOp('^')) {
      take();
      a = wrap(a ^ parseAnd());
    }
    return a;
  }
  function parseAnd(): bigint {
    let a = parseShift();
    while (isOp('&')) {
      take();
      a = wrap(a & parseShift());
    }
    return a;
  }
  function parseShift(): bigint {
    let a = parseAdd();
    while (isOp('<<', '>>', '>>>')) {
      const op = (take() as { v: string }).v;
      const n = shiftCount(signed(parseAdd()));
      if (op === '<<') a = n >= W ? 0n : wrap(a << n);
      else if (op === '>>') a = wrap(signed(a) >> (n >= W ? W : n));
      else a = n >= W ? 0n : wrap(a) >> n;
    }
    return a;
  }
  function parseAdd(): bigint {
    let a = parseMul();
    while (isOp('+', '-')) {
      const op = (take() as { v: string }).v;
      const b = parseMul();
      a = wrap(op === '+' ? a + b : a - b);
    }
    return a;
  }
  function parseMul(): bigint {
    let a = parseUnary();
    while (isOp('*', '/', '%')) {
      const op = (take() as { v: string }).v;
      const b = parseUnary();
      if (op === '*') a = wrap(a * b);
      else {
        if (b === 0n) throw new ToolError('Division by zero.');
        a = op === '/' ? wrap(a) / wrap(b) : wrap(a) % wrap(b);
      }
    }
    return a;
  }
  function parseUnary(): bigint {
    if (isOp('~')) {
      take();
      return wrap(mask ^ wrap(parseUnary()));
    }
    if (isOp('-')) {
      take();
      return wrap(-parseUnary());
    }
    if (isOp('+')) {
      take();
      return parseUnary();
    }
    return parsePrimary();
  }
  function parsePrimary(): bigint {
    const t = take();
    if (t.t === 'num') return wrap(t.v);
    if (t.t === 'op' && t.v === '(') {
      const v = parseOr();
      if (!isOp(')')) throw new ToolError('A closing parenthesis ")" is missing.');
      take();
      return v;
    }
    if (t.t === 'id') {
      if (t.v !== 'rol' && t.v !== 'ror') throw new ToolError(`Unknown name "${t.v}". Available functions: rol(x, n), ror(x, n).`);
      if (!isOp('(')) throw new ToolError(`${t.v} needs arguments: ${t.v}(x, n).`);
      take();
      const x = parseOr();
      if (!isOp(',')) throw new ToolError(`${t.v} needs two arguments: ${t.v}(x, n).`);
      take();
      const n = parseOr() % W;
      if (!isOp(')')) throw new ToolError('A closing parenthesis ")" is missing.');
      take();
      const k = t.v === 'rol' ? n : (W - n) % W;
      return wrap((x << k) | (x >> (W - k)));
    }
    if (t.t === 'end') throw new ToolError('The expression ends too early. Something is missing after the last operator.');
    throw new ToolError(`Unexpected "${(t as { v: string }).v}".`);
  }

  const value = parseOr();
  if (peek().t !== 'end') throw new ToolError(`Unexpected "${(peek() as { v: string }).v}" after the expression.`);
  const bin = value.toString(2).padStart(width, '0');
  const setBits: number[] = [];
  for (let i = 0; i < width; i++) if ((value >> BigInt(i)) & 1n) setBits.push(i);
  const bytes = value.toString(16).padStart(width / 4, '0').match(/../g)!;
  return {
    unsigned: value,
    signed: signed(value),
    width,
    hex: '0x' + value.toString(16).toUpperCase().padStart(width / 4, '0'),
    binary: bin.match(/.{8}/g)!.join(' '),
    octal: '0o' + value.toString(8),
    popcount: setBits.length,
    leadingZeros: value === 0n ? width : bin.indexOf('1'),
    trailingZeros: value === 0n ? width : bin.length - 1 - bin.lastIndexOf('1'),
    setBits,
    byteSwapped: '0x' + bytes.reverse().join('').toUpperCase(),
  };
}
