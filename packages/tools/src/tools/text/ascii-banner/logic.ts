import { ToolError } from '@/core/types';

/** Fonts bundled with the Tool (each is a separate local file, loaded on demand). */
export const FONTS = ['Standard', 'Slant', 'Big', 'Small', 'Doom'] as const;
export type BannerFont = (typeof FONTS)[number];
export type Layout = 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing';

const loaders: Record<BannerFont, () => Promise<{ default: string }>> = {
  Standard: () => import('figlet/importable-fonts/Standard.js'),
  Slant: () => import('figlet/importable-fonts/Slant.js'),
  Big: () => import('figlet/importable-fonts/Big.js'),
  Small: () => import('figlet/importable-fonts/Small.js'),
  Doom: () => import('figlet/importable-fonts/Doom.js'),
};

const parsed = new Set<string>();

/** Render text as an ASCII-art banner with FIGlet. Each input line becomes its own banner. */
export async function renderBanner(text: string, font: BannerFont, layout: Layout = 'default'): Promise<string> {
  const { default: figlet } = await import('figlet');
  if (!parsed.has(font)) {
    figlet.parseFont(font, (await loaders[font]()).default);
    parsed.add(font);
  }
  try {
    return text
      .split('\n')
      .map((line) => (line.trim() === '' ? '' : figlet.textSync(line, { font, horizontalLayout: layout, verticalLayout: 'default' }).replace(/\s+$/, '')))
      .join('\n\n')
      .replace(/^\n+|\n+$/g, '');
  } catch (e) {
    throw new ToolError(`Could not draw this text: ${e instanceof Error ? e.message : String(e)}`);
  }
}
