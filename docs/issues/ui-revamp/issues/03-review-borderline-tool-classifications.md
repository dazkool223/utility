# 03: Review borderline Tool classifications

**What to build:** The owner reviews the Tools whose Audience is not obvious from their Category (for example Base64 image decoding, timestamp converters, text helpers, number and unit Tools) and sets the final `general` or `developer` value for each. The per-Tool value always overrides the Category default.

**Blocked by:** 02 (Audience toggle end to end).

**Status:** ready-for-human

- [ ] A list of every Tool with its first-pass Audience is available for review, grouped by Category
- [ ] Each borderline Tool has a deliberate final Audience
- [ ] With the switch off, browsing shows a set of Tools the owner is happy to present to a casual visitor
- [ ] Any change is covered by the existing Audience tests (no Tool without an Audience)
