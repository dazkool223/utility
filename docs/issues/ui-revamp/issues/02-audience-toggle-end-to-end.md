# 02: Audience toggle end to end

**What to build:** A visitor can switch "Developer tools" on or off and see browsing change accordingly. Every Tool declares an Audience of `general` or `developer`, classified by Category as a first pass. With the switch off, browsing shows general Tools only and hides any Category left with none. With it on, developer Tools appear after the general ones in each Category. Search and Smart Paste always cover every Tool, ranking general above developer on equal relevance, with a small "Dev" tag on developer results. Direct links to any Tool still open. The choice is stored as a Preference (never next to Tool Input or Output), defaulting to off on the Website and on in the Extension. "Audience" is added to the glossary. For now the switch lives on the current home page; ticket 05 moves it into the rail.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Every registered Tool declares an Audience, and a guard test fails if one does not
- [ ] First-pass classification by Category is applied to all Tools (ticket 03 reviews borderline ones)
- [ ] Browsing with the switch off shows general Tools only and hides Categories with no general Tools; with it on, general Tools come first, then developer Tools
- [ ] Search finds developer Tools with the switch off; ties rank general first; developer results carry a "Dev" tag
- [ ] Smart Paste of a developer artefact (for example a JWT) with the switch off still suggests the matching Tool
- [ ] A direct URL to a developer Tool opens normally with the switch off
- [ ] The choice persists across reloads; the default is off on the Website and on in the Extension; a stored choice always wins over the default
- [ ] The setting is stored only as a Preference and never with Tool Input or Tool Output
- [ ] Core unit tests cover filtering, ordering, search tie-break and Category hiding; Playwright shell tests cover the visible behaviour
- [ ] The glossary defines "Audience"
