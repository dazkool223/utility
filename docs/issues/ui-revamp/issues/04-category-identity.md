# 04: Category identity

**What to build:** Each Category has one distinct icon and one colour, defined once and read everywhere. Colours share the same lightness and chroma so no Category looks louder than another. Browse views list Tools by name only, with a thin Category colour edge, and no per-Tool icons. A Tool's description appears on hover or focus and in search results, not on the browse grid.

**Blocked by:** 01 (Warm theme and fonts foundation).

**Status:** ready-for-agent

- [ ] All 16 Categories have a distinct icon and colour from a single definition
- [ ] Category colours work in both themes and meet contrast requirements
- [ ] Browse grids show Tool name and Category colour edge only; no per-Tool icons and no descriptions
- [ ] A Tool's description appears on hover and keyboard focus, and in search results
- [ ] Category headings use the serif title style
- [ ] Existing Category and Tool navigation still works; Playwright shell tests pass
