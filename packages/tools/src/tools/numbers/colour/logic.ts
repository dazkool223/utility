import { ToolError } from '@/core/types';
import { colorsNamed, converter, differenceEuclidean, formatHex, formatHex8, nearest, parse, wcagContrast, wcagLuminance } from 'culori';

const toRgb = converter('rgb');
const toHsl = converter('hsl');
const toHwb = converter('hwb');
const toLab = converter('lab');
const toLch = converter('lch');
const toOklab = converter('oklab');
const toOklch = converter('oklch');

const round = (n: number | undefined, d: number): number => {
  const v = n ?? 0;
  const f = 10 ** d;
  const r = Math.round(v * f) / f;
  return Object.is(r, -0) ? 0 : r;
};

export interface ColourInfo {
  hex: string;
  alpha: number;
  rows: Array<[string, string]>;
  outsideSrgb: boolean;
}

const NAMES = Object.keys(colorsNamed);
const named = (n: string) => {
  const v = colorsNamed[n as keyof typeof colorsNamed];
  return { mode: 'rgb' as const, r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
};
const nearestName = nearest(NAMES, differenceEuclidean('lab65'), named);

export function parseColour(input: string) {
  const t = input.trim();
  if (!t) throw new ToolError('Enter a colour, like #ff6600, rgb(255 102 0), hsl(24 100% 50%), oklch(0.7 0.18 50) or rebeccapurple.');
  // Allow a bare 3- or 6-digit hex without the leading #.
  const c = parse(/^[0-9a-f]{3,8}$/i.test(t) && [3, 4, 6, 8].includes(t.length) ? '#' + t : t);
  if (!c) throw new ToolError(`"${t}" is not a colour I can read. Try #rrggbb, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch() or a CSS colour name.`);
  return c;
}

export function describeColour(input: string): ColourInfo {
  const c = parseColour(input);
  const rgb = toRgb(c);
  const alpha = round(c.alpha ?? 1, 3);
  const outside = [rgb.r, rgb.g, rgb.b].some((v) => v < -0.0005 || v > 1.0005);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const R = Math.round(clamp(rgb.r) * 255);
  const G = Math.round(clamp(rgb.g) * 255);
  const B = Math.round(clamp(rgb.b) * 255);
  const hex = formatHex({ mode: 'rgb', r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) });
  const a = alpha < 1 ? ` / ${alpha}` : '';
  const hsl = toHsl(c);
  const hwb = toHwb(c);
  const lab = toLab(c);
  const lch = toLch(c);
  const oklab = toOklab(c);
  const oklch = toOklch(c);
  const rows: Array<[string, string]> = [['HEX', hex.toUpperCase()]];
  if (alpha < 1) rows.push(['HEX with alpha', formatHex8({ mode: 'rgb', r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b), alpha }).toUpperCase()]);
  rows.push(
    ['RGB', `rgb(${R} ${G} ${B}${a})`],
    ['RGB (percent)', `rgb(${round(clamp(rgb.r) * 100, 1)}% ${round(clamp(rgb.g) * 100, 1)}% ${round(clamp(rgb.b) * 100, 1)}%${a})`],
    ['HSL', `hsl(${round(hsl.h, 1)} ${round(hsl.s * 100, 1)}% ${round(hsl.l * 100, 1)}%${a})`],
    ['HWB', `hwb(${round(hwb.h, 1)} ${round(hwb.w * 100, 1)}% ${round(hwb.b * 100, 1)}%${a})`],
    ['LAB', `lab(${round(lab.l, 2)} ${round(lab.a, 2)} ${round(lab.b, 2)}${a})`],
    ['LCH', `lch(${round(lch.l, 2)} ${round(lch.c, 2)} ${round(lch.h, 2)}${a})`],
    ['OKLAB', `oklab(${round(oklab.l, 4)} ${round(oklab.a, 4)} ${round(oklab.b, 4)}${a})`],
    ['OKLCH', `oklch(${round(oklch.l, 4)} ${round(oklch.c, 4)} ${round(oklch.h, 2)}${a})`],
  );
  const exact = NAMES.find((n) => formatHex(named(n)) === hex);
  rows.push(['CSS name', exact ?? `none (closest: ${nearestName(c, 1)[0]})`]);
  const white = wcagContrast(rgb, 'white');
  const black = wcagContrast(rgb, 'black');
  rows.push(
    ['Luminance (WCAG)', String(round(wcagLuminance(rgb), 4))],
    ['Contrast with white', `${round(white, 2)}:1 (${grade(white)})`],
    ['Contrast with black', `${round(black, 2)}:1 (${grade(black)})`],
  );
  if (outside) rows.push(['Gamut', 'Outside the sRGB range; the RGB and HEX values above are clamped to the nearest displayable colour.']);
  return { hex, alpha, rows, outsideSrgb: outside };
}

function grade(ratio: number): string {
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large text only' : 'fails WCAG';
}
