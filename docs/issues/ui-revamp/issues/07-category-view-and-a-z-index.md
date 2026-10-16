# 07: Category view and A–Z index

**What to build:** Opening a Category shows a dense, name-only grid of its Tools with the Category colour edge. The breadcrumb on a Tool page links to that Category view. An A–Z index lists every Tool by name, for visitors who know the name but not the Category. Both respect the audience switch.

**Blocked by:** 05 (Persistent rail).

**Status:** ready-for-agent

- [ ] Selecting a Category in the rail or breadcrumb opens a dense name-only grid of that Category's Tools
- [ ] The Category view and the A–Z index respect the switch: with it off, developer Tools are absent; with it on, general Tools come first within a Category
- [ ] The A–Z index lists every Tool when the switch is on, in alphabetical order, and is reachable from the rail
- [ ] Tool descriptions appear on hover and focus, not on the grid
- [ ] Existing Tool URLs are unchanged
- [ ] Playwright shell tests cover both views with the switch on and off
