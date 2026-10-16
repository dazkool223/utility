# Utility Platform

A free, open-source collection of developer utilities that run entirely in the user's browser. No user data, and no request of any kind, leaves the device after the app has loaded.

## Language

### Tools

**Tool**:
A single self-contained utility that transforms, inspects, or generates something (e.g. JSON Formatter, PDF Merge).
_Avoid_: Util, utility, app, widget

**Category**:
A named grouping of Tools shown together in navigation (e.g. JSON, PDF, Images).
_Avoid_: Section, module, group

**Audience**:
Whether a Tool is aimed at everyone (`general`) or at developers (`developer`). It controls what browsing shows when the "Developer tools" switch is off; it never limits what search, Smart Paste, Favourites, Recents or direct links can reach. The switch is stored as a Preference, off by default on the Website and on in the Extension.
_Avoid_: Level, mode, role

**Tool Input**:
Whatever the user gives a Tool: pasted text, a dropped file, or form values. It is never persisted, not even on the device.
_Avoid_: Data, payload, document

**Tool Output**:
Whatever a Tool produces from its Tool Input. Like Tool Input, it is never persisted; the user copies or downloads it.
_Avoid_: Result, export

**Preferences**:
The only state kept on the user's device: settings (theme, etc.), Favourite Tools and Recent Tools. Never contains Tool Input or Tool Output.
_Avoid_: History, saved state, profile

**Favourite Tool**:
A Tool the user has pinned for quick access. Part of Preferences.
_Avoid_: Bookmark, starred tool

**Recent Tools**:
The Tools the user opened most recently, stored by name only. Part of Preferences.
_Avoid_: History

**Alias**:
An alternative search term that finds a Tool (e.g. "b64" → Base64, "epoch" → Unix timestamp).
_Avoid_: Tag, keyword

**Smart Paste**:
Recognising what pasted or dropped content is (a JWT, a PDF, a cron expression…) and suggesting the Tools that handle it.
_Avoid_: Auto-detect, magic

**Heavy Tool**:
A Tool whose engine is too large to ship with the app shell, so it is fetched from our own origin on first use and then cached for offline use (e.g. video conversion, OCR).
_Avoid_: Plugin, extension, lazy tool

**Restriction**:
A known limitation a Tool has in a given situation (input above the Supported Size, a missing browser feature, a reduced-fidelity engine). It is shown before the user starts, and the user may still proceed.
_Avoid_: Limitation, warning, error

**Supported Size**:
The largest Tool Input a Tool is tested and guaranteed to handle. Larger input is a Restriction, not a hard block.
_Avoid_: Max size, file limit

### Surfaces

**Surface**:
A way the product is delivered to users. There are two: the Website and the Extension.
_Avoid_: Platform, target, client

**Website**:
The full product: every Tool, installable as an offline-capable PWA.
_Avoid_: Web app, site

**Extension**:
The lightweight browser add-on (Chrome and Firefox). It contains every Tool except Heavy Tools, which it links out to on the Website.
_Avoid_: Plugin, add-on

**Quick Launcher**:
The Extension's toolbar popup offering a small set of instant text Tools.
_Avoid_: Popup, mini app

### Guarantees

**Offline Guarantee**:
The promise that, after the first visit, every Tool already used works with no network connection.
_Avoid_: Offline mode
