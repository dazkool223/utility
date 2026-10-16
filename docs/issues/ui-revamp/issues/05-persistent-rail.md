# 05: Persistent rail

**What to build:** On desktop, every page has a left rail holding, top to bottom, the "Developer tools" switch, Favourites, Recents and the Categories with their icons. Favourites and Recents show regardless of the switch. On narrow screens the rail collapses to a menu plus the command palette. The header search button is removed; the home page search and the palette remain the entry points. The switch moves here from the home page.

**Blocked by:** 02 (Audience toggle end to end), 04 (Category identity).

**Status:** ready-for-agent

- [ ] The rail appears on the home page, Category views and Tool pages on desktop
- [ ] The audience switch lives in the rail and behaves exactly as in ticket 02
- [ ] Favourites and Recents appear in the rail on a Tool page and are unaffected by the switch
- [ ] Categories in the rail show their icon and colour and respect the switch (developer-only Categories hidden when it is off)
- [ ] On a narrow viewport the rail collapses to a usable menu; the command palette shortcut still works everywhere
- [ ] The header search button is gone and no page has two competing search entry points
- [ ] The rail, switch and links are fully operable by keyboard with sensible landmarks and focus order
- [ ] Playwright shell tests cover rail contents, collapse and keyboard use
