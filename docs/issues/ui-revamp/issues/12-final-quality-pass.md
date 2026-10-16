# 12: Final quality pass

**What to build:** The redesign is verified as a whole: accessible, readable in both themes, offline-ready and within budget, with no leftover assertions or UI from the old layout.

**Blocked by:** 03 (Review borderline Tool classifications), 05, 06, 07, 08, 09, 10, 11.

**Status:** ready-for-agent

- [ ] Keyboard and screen-reader pass over the rail, switch, search, chip and Tool pages, with landmarks and focus order sensible
- [ ] Contrast checked in both themes for text, controls and Category colours
- [ ] Reduced-motion preference respected throughout
- [ ] The new fonts and assets are precached and the app works offline after the first visit (Offline Guarantee)
- [ ] No outgoing request after load (ADR 0001)
- [ ] Performance budgets pass after a production build
- [ ] Old-layout assertions in the end-to-end suites are updated or removed; all suites and workspace typecheck pass
- [ ] No leftover duplicate search entry points or repeated privacy messages
