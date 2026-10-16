Status: ready-for-agent

# UI revamp: warm shell, findable Tools, audience toggle

## Problem Statement

The usage of the platform is good, but the look and feel is not. It is an unmodified neutral grey component-library theme with no identity: no typography of its own, no colour beyond a single indigo used for editor selection, and no sense of place. Every Tool is the same bordered box with a name and two lines of text, so a visitor faces a long wall of identical cards across 128 Tools and 16 Categories and can only tell them apart by reading. There is no persistent navigation, so switching Tools means going back to the home page or opening the palette; Favourites and Recents are only visible on the home page. There are two competing search entry points (the header and the home page), and Smart Paste, the product's best idea, sits as a secondary block under the search and vanishes when the user types.

People who arrive just to browse, not developers, are overwhelmed by Tools like hash generators and JWT decoders that mean nothing to them, mixed in with the PDF, image and QR Tools they came for.

The Offline Guarantee and the promise that nothing leaves the device appear in four places (header subtitle, home headline, footer, Tool badges). That repetition reads as nagging rather than reassurance.

## Solution

Re-skin and re-lay-out the shell, leaving Tool behaviour untouched.

The shell gets a homely brand layer: a warm cocoa dark theme by default (with a cream light theme as the alternate), one terracotta accent, restrained per-Category colour and a distinct icon per Category, a friendly serif for page and Category titles only, and a light touch of voice in greetings, empty states, the not-found page and error messages. Buttons, labels and Tool names stay plain, and no Tool gets a tagline.

The working area of every Tool stays disciplined: full-width, dense, monospaced panes, neutral surfaces and restrained colour. The warmth stops at the pane edge.

Finding Tools becomes the priority. A persistent left rail holds the Categories, Favourites and Recents on every page. The home page is a single "bench": one always-focused surface that combines search and Smart Paste, then Favourites, Recents and the Categories. An A-Z index lists every Tool by name. Tools are identified by name and Category colour, not per-Tool icons.

A new General / Developer audience toggle keeps casual visitors from being overwhelmed. By default, browsing shows general-purpose Tools only; turning the toggle on reveals the developer Tools, always listed after the general ones. Search and Smart Paste always cover all Tools regardless of the toggle.

The privacy and offline message appears exactly once, as a small status chip at the foot of the rail that opens a short explanation and a link to the Privacy page.

## User Stories

### Finding Tools

1. As a first-time visitor, I want the search field focused as soon as the home page loads, so that I can type what I need immediately.
2. As a visitor, I want one search surface instead of a header search and a home search, so that I am never unsure which to use.
3. As a visitor, I want search to match Aliases (such as "b64" or "epoch"), so that I find a Tool by the name I know it by.
4. As a visitor, I want the matched Alias shown in the result (for example "b64 → Base64"), so that I understand why a Tool was returned.
5. As a visitor, I want each result to show its Category, so that I can tell similarly named Tools apart.
6. As a visitor, I want search to cover every Tool regardless of the audience toggle, so that I can always find a Tool by name.
7. As a casual visitor, I want general-purpose Tools to rank above developer-only Tools when relevance is otherwise equal, so that the results make sense to me.
8. As a visitor, I want developer-only results to carry a small "Dev" tag, so that I know why a result may not suit me.
9. As a visitor, I want the keyboard shortcut for the command palette to keep working everywhere, so that I can jump to any Tool without the mouse.
10. As a visitor, I want a persistent left rail of Categories on desktop, so that I can browse without returning to the home page.
11. As a visitor, I want each Category to have its own icon and colour, so that I can recognise a Category at a glance.
12. As a visitor, I want a Category view to show a dense grid of Tool names only, so that I can scan many Tools quickly.
13. As a visitor, I want a Tool's description to appear on hover, in search results and on the Tool page header, so that I can learn what a Tool does without clutter on the browse grid.
14. As a visitor, I want an A-Z index of all Tools, so that I can find a Tool I know by name without knowing its Category.
15. As a visitor, I want Favourite Tools pinned in the rail on every page, so that my most-used Tools are one click away.
16. As a visitor, I want Recent Tools in the rail on every page, so that I can return to what I just used.
17. As a visitor, I want my Favourites and Recents to show regardless of the audience toggle, so that a Tool I chose never disappears from my shortcuts.
18. As a visitor, I want the breadcrumb on a Tool page to take me to that Category's list, so that I can see sibling Tools.
19. As a visitor, I want related Tools reachable from the Tool page, so that I can chain one job to the next.

### Smart Paste

20. As a visitor, I want to paste or drop content straight onto the home bench, so that the platform tells me which Tools handle it.
21. As a visitor, I want the best-matching Tool listed first among the suggestions, so that I can act without reading them all.
22. As a visitor with the audience toggle off, I want Smart Paste to still suggest a developer Tool (for example a JWT decoder for a pasted token), so that pasting always gets me an answer.
23. As a visitor, I want Smart Paste to remain visible while I type in the search, so that I do not lose it by searching.
24. As a visitor, I want the pasted content carried into the chosen Tool, so that I do not have to paste it again.

### Audience toggle

25. As a casual visitor, I want developer-only Tools hidden by default when browsing, so that I am not overwhelmed.
26. As a developer, I want a clearly labelled "Developer tools" switch in the rail, so that I can reveal the full set in one action.
27. As a developer, I want developer Tools to appear in the same Categories as general ones, ordered after the general ones, so that nothing moves around unpredictably.
28. As a casual visitor, I want Categories that contain only developer Tools hidden while the toggle is off, so that I never see an empty or irrelevant Category.
29. As a visitor, I want my toggle choice remembered on this device as a setting, so that I do not have to set it each visit.
30. As a developer, I want the toggle's state to be stored only as a Preference and never alongside Tool Input or Output, so that the privacy guarantees hold.
31. As a developer, I want a bookmarked or shared link to a developer Tool to open normally even when the toggle is off, so that links never break.
32. As an Extension user, I want the toggle on by default, so that the developer Tools I installed the Extension for are there immediately.
33. As a Website visitor, I want the toggle off by default, so that the first impression is approachable.
34. As the maintainer, I want every Tool to declare whether it is general or developer, so that classification is never missing or ambiguous.
35. As the maintainer, I want a first-pass classification by Category that I can override per Tool, so that borderline Tools are placed deliberately.

### Home and voice

36. As a visitor, I want the home page to open with a short friendly greeting rather than a statistic or a trust slogan, so that the first impression is warm.
37. As a visitor, I want friendly empty states (no Favourites yet, no Recents yet, no search matches), so that blank areas guide me instead of confusing me.
38. As a visitor, I want a kind not-found page, so that a wrong link does not feel like a dead end.
39. As a visitor, I want Tool errors to be worded kindly and clearly, so that I know what to do next.
40. As a developer, I want buttons, labels and Tool names to stay plain and literal, so that the warmth never costs clarity.
41. As a visitor, I want no tagline on any individual Tool, so that the interface stays quiet.

### Tool page and working area

42. As a user in a Tool, I want a slim header with the Category colour edge, the Tool name, a one-line description, an icon-only Favourite control and a "works well with" menu, so that I know where I am without losing space.
43. As a user in a Tool, I want the input and output panes to use the full available width and height, so that I can work with large content.
44. As a user in a Tool, I want the options bar attached to the panes like a tray, so that options read as part of the work surface.
45. As a user in a Tool, I want dense monospaced text and restrained colour in the panes, so that the content is the focus.
46. As a user, I want a Restriction shown as a clearly designed notice before I start, so that I understand a limit without it looking like an error.
47. As a user of a Heavy Tool, I want the first-use engine download explained plainly and only where relevant, so that it does not read as a warning.
48. As a user, I want the existing keyboard shortcuts (run, copy output, palette) unchanged, so that my muscle memory still works.
49. As a screen-reader user, I want landmarks, labels and focus order preserved or improved in the new layout, so that the redesign does not reduce accessibility.
50. As a keyboard user, I want the rail, toggle, search and chip fully operable without a mouse, so that I can navigate by keyboard.

### Look and feel

51. As a visitor, I want the dark theme by default with a warm cocoa palette, so that the product feels distinctive and comfortable.
52. As a visitor, I want a warm cream light theme as the alternate, so that I can switch for bright environments.
53. As a visitor, I want the system option kept in the theme control, so that I can still follow my operating system.
54. As a visitor, I want the current theme state to be visible at a glance, so that I know what the control will do.
55. As a visitor, I want layered surfaces (page, card, popover) with soft depth, so that the interface has hierarchy.
56. As a visitor, I want a single warm accent for focus, primary actions and the active rail item, so that the interface has one clear signal colour.
57. As a visitor, I want Category colours that share the same lightness and chroma, so that no Category looks louder than another.
58. As a developer, I want syntax colours in the editor panes to stay legible in both themes, so that code remains readable.
59. As a visitor with reduced-motion settings, I want animations minimised, so that the interface is comfortable.
60. As a visitor, I want text and controls to meet contrast requirements in both themes, so that everything is readable.
61. As the maintainer, I want semantic success, info, warning and destructive colours defined once, so that Tools stop improvising colours.
62. As the maintainer, I want the favourite star to use the accent token, so that no colour is hard-coded.

### Privacy signal

63. As a visitor, I want the privacy and offline message shown in exactly one place, so that I am reassured without being nagged.
64. As a visitor, I want that place to be a small chip at the foot of the rail visible on every page, so that I can always find it.
65. As a visitor, I want the chip to open a short explanation of the guarantee and a link to the Privacy page, so that I can learn the detail on demand.
66. As a visitor, I want the chip to change only if something is actually wrong (such as a Heavy Tool engine not yet cached), so that its normal state stays calm.
67. As a visitor, I want the header subtitle, home headline statistic and footer line removed, so that the message is not repeated.

### Surfaces

68. As a mobile visitor, I want the rail to collapse into the palette and a compact menu, so that the layout works on a small screen.
69. As an Extension user, I want the Quick Launcher to be a compact single-column bench with no rail, so that the popup is fast and uncluttered.
70. As an Extension user, I want Heavy Tools to still link out to the Website clearly, so that the Extension stays light.
71. As an installed PWA user, I want the new design to load offline, so that the Offline Guarantee is unchanged.

### Maintainability

72. As the maintainer, I want the new look applied through the shared theme tokens and the shared UI kit, so that all 128 Tools adopt it without per-Tool edits.
73. As a Tool author, I want the shared control components to keep their current interface, so that existing Tools keep compiling and working.
74. As the maintainer, I want fonts self-hosted and bundled, so that no outgoing connection is made after load.
75. As the maintainer, I want the new assets to stay within the performance budgets, so that load speed does not regress.

## Implementation Decisions

**Scope and ownership.** This is a presentation and navigation change. No Tool logic, Tool Input handling, Tool Output handling or Smart Paste detection changes. The shell is shared by the Website and the Extension (ADR 0002), so both Surfaces receive the redesign, with the Extension using its own compact launcher layout.

**Audience classification (new domain concept).**
- Add an Audience attribute to Tool metadata with two values: general and developer. It is required for every Tool.
- Provide a first-pass classification by Category: PDF, Images, Media, Office and Archives lean general; JSON, Code, Crypto, Encoders, Formats, Network, Binary and Web lean developer; Text, Time and Numbers are mixed and are classified per Tool. The owner reviews borderline Tools individually and the per-Tool value always wins.
- Add "Audience" to the glossary as: whether a Tool is aimed at everyone or at developers; it controls what browsing shows, never what search or Smart Paste can find.

**Audience toggle behaviour.**
- Stored in Preferences as a setting alongside theme. It never contains Tool Input or Tool Output.
- Default off on the Website and on in the Extension. A stored choice always wins over the default.
- When off, browsing views (home Categories, Category view, A-Z index) show general Tools only and hide Categories left with no general Tools. When on, all Tools show, general first, then developer, within each Category.
- Search, Smart Paste, the command palette, Favourites, Recents, related Tools and direct URLs are unaffected by the toggle.
- Search ranks by relevance; on ties, general ranks above developer. Developer-only results carry a "Dev" tag. A search result also shows the matched Alias and the Category.

**Shell and navigation.**
- A persistent left rail on desktop containing, top to bottom: the audience toggle, Favourites, Recents, the Categories (each with its icon and colour), and the privacy chip. On narrow screens it collapses to a menu plus the palette.
- The header search button is removed; the always-focused search on the home bench and the command palette are the two entry points, and both use one shared search module.
- The home bench combines search and Smart Paste on one surface, with Smart Paste remaining visible while typing. Below it: Favourites, Recents, then Category tiles.
- Browse views list Tools by name with the Category colour edge, no per-Tool icons, no descriptions. Descriptions appear on hover/focus, in search results and in the Tool page header.
- An A-Z index view lists all Tools by name and respects the audience toggle in the same way as other browse views.
- Direct links keep their current URL structure.

**Icons.** One distinct icon per Category from the existing icon set. No per-Tool icons. The Category icon and colour are defined once in the Category definitions so every view reads from the same source.

**Tool page.**
- Slim recipe-card style header: Category colour edge, name, one-line description from existing metadata, icon-only Favourite control, and a "works well with" menu built from the existing related-Tools metadata. This is the only recipe-card element.
- The working area (Tool body) fills the available width and height. Options bar is attached to the panes. Restrictions render as a distinct designed notice before the Tool, with the existing "user may proceed" semantics preserved.
- The Heavy Tool first-use note is shown in the Tool page header only, not as a repeated badge.

**Theme and tokens.**
- Dark is the default for new visitors; light and system remain selectable. The theme control shows its current state.
- Warm cocoa dark and cream light palettes, layered surfaces (page, card, popover), one terracotta accent, Category tints at equal lightness and chroma, and new semantic tokens for success and info, with warning and destructive retained. The favourite star and any other hard-coded colours move onto tokens.
- Editor (code pane) theming keeps its token-driven approach and is re-tuned to the new palette. Syntax colours stay legible in both themes.
- Slightly rounder corners and soft shadows for shell elements; panes stay denser and flatter. Motion is minimal and respects reduced-motion.
- The shared UI kit's component interface is unchanged so that all Tools inherit the new look; its internal styling is what changes.

**Typography.** A friendly serif for page and Category titles only; a clean sans for interface text; a monospace for panes and small readouts. All fonts are self-hosted and bundled (ADR 0001). Font files must be included in the Offline Guarantee precache and stay within the performance budgets.

**Voice (light).** Friendly copy only in: the home greeting, empty states, the not-found page, and error messages. Buttons, labels, Tool names and Category names stay plain. No per-Tool taglines. No new product name; the brand slot stays minimal until the owner supplies a name (the product is identified by its subdomain).

**Privacy signal.** The chip at the foot of the rail is the only place the privacy and offline message appears. It opens a short popover with the guarantee and a link to the Privacy page. It changes state only on an actual problem (for example a Heavy Tool engine not yet cached). The header subtitle, home headline statistic, footer line and any repeated badges are removed. The Privacy page itself is kept.

**Extension.** The Quick Launcher is a compact single-column variant of the bench: search and Smart Paste, Favourites and Recents, no rail. Heavy Tools continue to link out to the Website. The audience toggle defaults to on.

**Constraints from ADRs.** No new network requests after load (ADR 0001): fonts and any assets are bundled. The shell remains shared (ADR 0002).

**Delivery order (suggested).** Theme tokens and fonts first, then the shared UI kit, then audience metadata and Preferences, then the shell (rail, home bench, Category view, A-Z index, Tool page header), then the Extension layout, then removal of the repeated privacy messages.

## Testing Decisions

**What makes a good test here.** Test only what a person can observe: what is visible, what is findable, what persists across a reload, where a link goes. Do not assert on class names, colours, fonts, DOM structure or component internals, and do not add visual-snapshot tests, since styling will keep changing during a redesign.

**Primary seam: the existing Playwright shell end-to-end suite.** It builds the app, serves it with production headers and runs in Chromium, Firefox and WebKit. New or updated behaviour tests through it:
- Search finds a Tool by name and by Alias, shows the matched Alias and Category, and covers developer Tools even when the toggle is off.
- With the toggle off, a developer-only Category is absent from browsing and a mixed Category shows only general Tools; with it on, developer Tools appear after general ones.
- The toggle choice survives a reload and is stored only as a Preference.
- Pasting a developer artefact (for example a JWT) with the toggle off still suggests the matching Tool.
- A direct URL to a developer Tool opens with the toggle off.
- Favourites and Recents appear in the rail on a Tool page and are unaffected by the toggle.
- The privacy message appears exactly once on every page, in the rail chip, which opens an explanation with a link to the Privacy page.
- Dark is the default for a new visitor with no stored preference; light and system remain selectable.
- Keyboard operability of the rail, toggle, search and chip; the run, copy and palette shortcuts still work.
- A-Z index lists every Tool when the toggle is on and respects the toggle when off.
- The app makes no outgoing requests after load (existing network guard), including for fonts.

**Extension seam: the existing Extension end-to-end suite.** It loads the real extension in Chromium. Verify the Quick Launcher layout, the toggle defaulting to on, and the Heavy Tool link-out.

**One new unit-level seam: the existing core test file.** Audience rules are pure logic and are cheap to test precisely: browse filtering by toggle, general-before-developer ordering, search ignoring the toggle with general-first tie-breaking, hiding of fully developer-only Categories, and a guard test that every registered Tool declares an Audience.

**Prior art.** The shell end-to-end suite and per-category end-to-end specs, the Extension end-to-end suite, and the core unit tests for the registry, search and Preferences.

**Non-test gates.** Typecheck across the workspace, and the performance budget check after the production build (fonts and the larger shell must stay within budget).

## Out of Scope

- Per-Tool icons, per-Tool taglines, or renaming any Tool.
- A new product name or logo.
- Any change to Tool logic, Tool Input or Tool Output handling, Smart Paste detection, search ranking beyond the audience tie-break, or the Pipeline.
- New Tools, removed Tools, or changes to Supported Sizes and Restrictions content.
- Accounts, analytics, telemetry, or anything that stores Tool Input or Tool Output.
- Illustrations, textures or skeuomorphic artwork; custom per-Tool artwork.
- Localisation / translation.
- Visual-regression (screenshot) testing.
- Changing the deployment, PWA caching strategy (beyond including the new font files) or browser support matrix.

## Further Notes

- **Origin.** The direction came from a brainstorm that settled on a "grandmother's toolkit" brand layer (homely, light voice) over a "workbench" working area (dense, mono, restrained). The user explicitly wants the homely feel kept subtle and Tool findability prioritised over personality.
- **Decided by the user:** no per-Tool icons (Category icons only); dark by default; no product name for now; the audience toggle with search covering all Tools and general Tools shown first.
- **Assumptions to confirm before building:** the Extension defaults the audience toggle to on; Favourites and Recents ignore the toggle; the two test seams above; the first-pass Audience classification by Category (the owner reviews every borderline Tool).
- **Risk:** font files add weight. Keep the families and weights to the minimum needed and verify against the performance budgets early.
- **Risk:** the shared UI kit is consumed by all 128 Tools, so kit changes must keep its interface stable and be checked against the existing Tool end-to-end specs.
- The `CLAUDE.md` in this repo is a GitNexus-managed file in part; any build work must follow its impact-analysis rules before editing symbols.
