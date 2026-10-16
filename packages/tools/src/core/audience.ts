import { CATEGORIES, type Category } from './categories';
import type { CategoryId, ToolMeta } from './types';

/** Browsing order: general Tools first, then developer Tools; each group keeps its incoming order. */
export function audienceOrder(tools: readonly ToolMeta[]): ToolMeta[] {
  return [...tools.filter((t) => t.audience === 'general'), ...tools.filter((t) => t.audience === 'developer')];
}

/** The Tools a browsing view shows. Search, Smart Paste, Favourites, Recents and direct URLs do not use this. */
export function browseTools(tools: readonly ToolMeta[], showDeveloper: boolean): ToolMeta[] {
  return audienceOrder(showDeveloper ? tools : tools.filter((t) => t.audience === 'general'));
}

/** Tools of one Category as a browsing view shows them. */
export function browseCategoryTools(tools: readonly ToolMeta[], category: CategoryId, showDeveloper: boolean): ToolMeta[] {
  return browseTools(
    tools.filter((t) => t.category === category),
    showDeveloper,
  );
}

/** Categories a browsing view shows: those left with no visible Tool are hidden. */
export function browseCategories(tools: readonly ToolMeta[], showDeveloper: boolean): Category[] {
  return CATEGORIES.filter((c) => browseCategoryTools(tools, c.id, showDeveloper).length > 0);
}
