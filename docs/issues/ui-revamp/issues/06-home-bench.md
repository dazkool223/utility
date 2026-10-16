# 06: Home bench

**What to build:** The home page opens with a short, friendly greeting and one always-focused surface that combines search and Smart Paste. Smart Paste stays visible while the visitor types. Search results show the matched Alias (for example "b64 → Base64") and the Category. Below the bench are Favourites, Recents and Category tiles with name-only entries. Empty areas show friendly guidance. The statistic headline is replaced by the greeting.

**Blocked by:** 04 (Category identity), 05 (Persistent rail).

**Status:** ready-for-agent

- [ ] The search field is focused on load and there is one search surface on the page
- [ ] Smart Paste is part of the same surface and remains visible while typing
- [ ] Pasting or dropping content suggests the matching Tools, best match first, and carries the content into the chosen Tool
- [ ] A search result shows the matched Alias and the Category; search covers every Tool regardless of the switch, with the ties and "Dev" tag behaviour from ticket 02
- [ ] Favourites, Recents and Category tiles are shown name-only and respect the switch for Category tiles
- [ ] Empty Favourites, empty Recents and no-match states have friendly copy
- [ ] The home headline statistic is replaced by a short greeting
- [ ] Playwright shell tests cover focus, Alias display, Smart Paste with the switch off, and empty states
