# 01: Warm theme and fonts foundation

**What to build:** A new visitor with no stored Preferences sees the warm cocoa dark theme on every page of the Website and Extension, and every one of the 128 Tools picks up the new look without per-Tool edits. Light (cream) and system remain selectable, and the theme control shows its current state. One terracotta accent drives focus, primary actions and the active state. Surfaces are layered (page, card, popover) with soft depth. Fonts are self-hosted and work offline: a friendly serif for page and Category titles only, a clean sans for interface text, a monospace for panes and small readouts.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A new visitor with no stored theme Preference gets dark; light and system can still be chosen and persist across reloads
- [ ] The theme control shows the current setting at a glance
- [ ] Warm dark and cream light palettes, one accent and layered surfaces apply across the shell and every Tool body
- [ ] Success, info, warning and destructive semantic colours are defined once; the Favourite star and other hard-coded colours use tokens
- [ ] Category tints are not introduced here (that is ticket 04), but the token structure leaves room for them at equal lightness and chroma
- [ ] Code editor panes are re-tuned to the new palette and syntax colours stay legible in both themes
- [ ] The shared UI kit keeps its public interface; existing Tools compile and their end-to-end specs pass unchanged
- [ ] Fonts are bundled and included in the Offline Guarantee precache; the app makes no outgoing request after load (ADR 0001)
- [ ] Text and controls meet contrast requirements in both themes; reduced-motion is respected
- [ ] The performance budget check passes after a production build
