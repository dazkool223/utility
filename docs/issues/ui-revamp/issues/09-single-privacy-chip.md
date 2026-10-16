# 09: Single privacy chip

**What to build:** The privacy and offline message appears exactly once, as a small chip at the foot of the rail visible on every page. It opens a short explanation of the guarantee with a link to the Privacy page. In its normal state it is calm; it changes only when something is actually wrong, such as a Heavy Tool engine that is not yet cached. The header subtitle, the footer line and any repeated badges are removed. The Privacy page is kept.

**Blocked by:** 05 (Persistent rail).

**Status:** ready-for-agent

- [ ] The chip is present at the foot of the rail on the home page, Category views and Tool pages
- [ ] Activating the chip opens a short explanation and a link to the Privacy page; it is keyboard operable
- [ ] The header subtitle, footer privacy line and repeated badges are gone; the message appears exactly once on every page
- [ ] The chip's state changes only on a real problem and returns to calm otherwise
- [ ] The Privacy page still opens
- [ ] A Playwright shell test checks the message appears once per page across the main page types
