# Utility Platform — Product Spec (v1.0)

Status: **approved (2026-10-15)**: 123 Tools (all P0 and P1, plus selected P2), two held for licence (§8). Remaining open items in §9.

## 1. Product

A free, open-source collection of developer Tools that run entirely in the browser. Nothing a user gives a Tool leaves their device: after the app loads it makes no network requests at all ([ADR 0001](adr/0001-zero-network-after-load.md)).

## 2. Decisions so far

| # | Decision |
|---|---|
| Audience | Public, free, open source |
| Privacy | Zero network after load, enforced by CSP and checked in CI. No analytics, no CDNs, no Tools that need the network |
| On-device state | Preferences only (settings, Favourite Tools, Recent Tools), with a "clear" button. Tool Input and Tool Output are never persisted |
| Surfaces | Website (PWA, offline after first visit) **and** Extension (Chrome + Firefox, MV3). Launch together. Safari later |
| Heavy Tools | Website: fetched from our own origin on first use, then cached. Extension: not bundled; it links to the Tool on the Website |
| Extension features | Full catalog in a tab · Quick Launcher popup · right-click context menu on selected text. No page-reading permissions |
| Stack | React + Vite, static build, pnpm monorepo `packages/tools`, `apps/web`, `apps/extension` ([ADR 0002](adr/0002-monorepo-shared-tools-package.md)) |
| Hosting | Vercel (headers via `vercel.json`; Vercel Analytics / Speed Insights off) |
| Libraries | Use the best available open-source implementation; don't hand-roll what a maintained library already does well |
| Licensing | **Deferred.** Pick the best library now; a licence audit happens before launch (see §7) |
| Restrictions | When a Tool has a Restriction, show it up front and **let the user proceed anyway** |
| Mobile | Responsive; mobile is best-effort and outside the guarantee |
| Accessibility | WCAG 2.2 AA |
| Language | English only at launch |

## 3. Quality bar ("guaranteed working")

A Tool ships only when all of these pass in CI:

1. **Golden tests:** fixed inputs → exact expected outputs, including edge cases and malformed input.
2. **End-to-end tests** (Playwright) in Chromium, Firefox and WebKit. For the Extension: Chromium and Firefox.
3. **Network check:** any outgoing request during a test fails the build.
4. **No silent failure:** errors are shown in plain language; there is never a blank screen or a wrong output without an error.
5. **Restrictions declared:** every known Restriction (missing browser feature, Supported Size, reduced fidelity) is in the Tool's metadata, shown before the user starts, and tested.

## 4. Performance budgets (enforced in CI)

- App shell (home + search): **≤ 150 KB gzipped JS**, Lighthouse performance **≥ 95**.
- Each Tool is code-split. A non-Heavy Tool is **≤ 100 KB gzipped**. Anything bigger is a Heavy Tool (provisional threshold: engine > 2 MB, confirmed by measurement).
- Any work that can take more than about 50 ms runs in a **Web Worker**; the UI never freezes.
- Text Tools update live; input over about 1 MB is debounced.
- Multi-GB inputs are streamed (`Blob.stream()` / slicing) rather than loaded whole wherever the library allows.

## 5. Supported Sizes

| Input kind | Supported Size |
|---|---|
| Text / JSON / YAML / CSV | 50 MB |
| Images | 50 megapixels |
| PDF | 500 MB |
| Video / audio | 2 GB (WebAssembly hard limit for ffmpeg.wasm) |

Above the Supported Size the Tool shows a Restriction and asks the user whether to continue.

## 6. Extension specifics

- **Quick Launcher (popup):** JSON format, Base64, URL encode/decode, JWT decode, Unix timestamp, UUID, hash text, case converter, password generator.
- **Context menu on selected text:** Format as JSON · Decode JWT · Decode Base64 · URL-decode · Convert timestamp · Hash. Each opens the full Tool in an Extension tab with the selection as Tool Input. Uses `contextMenus` only; no host permissions.
- **Heavy Tools** are listed in the catalog with an "Open on Website" link instead of running in the Extension.
- Footer link to the Website: "all Tools, free, in your browser".

## 7. Usability: discovery and keyboard

With 100+ Tools, finding the right one fast matters as much as the Tools themselves.

### 7.1 One layout for every Tool
Every Tool uses the same layout: **Tool Input** pane, options bar, **Tool Output** pane. Copy, download and clear sit in the same place on every Tool. This keeps the keyboard shortcuts identical across Tools.

### 7.2 Discovery
- **Command palette** (`Ctrl/⌘ K`, available on every page): fuzzy search over Tool names, **aliases** ("b64", "epoch", "beautify", "prettify", "sha"), descriptions and Categories. It also runs app actions (toggle theme, favourite this Tool, open shortcut help).
- **Home page:** search box focused on load, a Favourite Tools row, a Recent Tools row, then Categories with a one-line description per Tool.
- **Smart Paste** (home page and command palette only, never inside a Tool): paste text or drop a file on the home page and the app detects what it is (JWT, JSON, YAML, Base64, Unix timestamp, UUID, URL, cron expression, PEM certificate; files by magic bytes: PDF, image, archive…). It then suggests the matching Tools, best match first. Detection runs locally like everything else.
- **Send to…:** a Tool's output can be opened directly as the input of a related Tool (JWT decode → JSON format). This is the first step towards the P1 Pipeline feature.
- **Related Tools** are listed under each Tool.
- **Deep links:** each Tool has a stable URL (`/json/format`). Links never contain Tool Input.

### 7.3 Keyboard shortcuts
Deliberately minimal and fixed (no remapping). `Mod` = `Ctrl` on Windows/Linux, `⌘` on macOS.

| Shortcut | Action |
|---|---|
| `Mod K` | Command palette (search Tools, run app actions) |
| `Mod Enter` | Run (for Tools that don't update live) |
| `Alt Shift C` | Copy Tool Output (`Mod Shift C` is reserved by browser DevTools) |
| `Esc` | Close palette or overlay |
| `Alt Shift U` | Extension only: open the Quick Launcher |

Rules:
- Never override essential browser shortcuts.
- Everything else is reachable by keyboard through normal focus order or the command palette. Shortcuts are shown in tooltips.
- Shortcuts are covered by the E2E tests.

## 8. Held for licence reasons

These are approved but held until the licence audit. Each needs a copyleft engine that would change the project's licence. ⏸ marks them in the checklist.

| Tool | Blocking engine | Licence | Plan while held |
|---|---|---|---|
| PDF Compress (P0) | mupdf.js | AGPL-3.0 | Not shipped. A licence-clean fallback exists: re-render pages as images (pdf.js + pdf-lib), which loses selectable text. Ship it only if you approve it. |
| Image Compressor: PNG palette-reduction mode (P0) | libimagequant | GPL-3.0 (verify) | The Compressor ships with MozJPEG, WebP, AVIF and lossless oxipng. Only the palette-reduction mode is held. |

Approved and **not** held:
- **PGP (openpgp.js, LGPL-3.0).** LGPL allows use from a permissive project if the library is loaded as a separate, unmodified, replaceable file and its notice is shipped. That is how we'll load it.
- **Audio convert / trim, Video → GIF (ffmpeg.wasm).** Use an LGPL-only ffmpeg core (no x264/GPL components) loaded as a separate file. MP3 encoding uses LAME (LGPL) the same way.
- **Media info (Mediabunny, MPL-2.0).** MPL is file-level copyleft: fine as long as we don't modify its files, or publish any changes to them.
- **User-agent parser.** Uses bowser or ua-parser-js v1 (both MIT), not the AGPL v2.
- **Libraries marked "(verify)" in the catalog** (jsonrepair, hash-wasm, bcryptjs, lorem-ipsum…). These are believed permissive. Each is confirmed when its Tool is built.

## 9. Open items

- **Project licence.** Earlier we leaned permissive (MIT/Apache-2.0). This decides whether the §8 holds can ever be released. Other copyleft engines that only unapproved Tools need: mupdf.js for redact and repair, @imgly background removal (AGPL), pandoc.wasm (GPL), ffmpeg GPL builds.
- Product name and domain.

---

## 10. Tool approval checklist

Approved: every ticked row. Unticked rows are out of scope for now. ⏸ = approved but held for licence reasons (see §8).

Markers: **H** = Heavy Tool (Website only; the Extension links out) · **⚠** = ships with a Restriction · **©** = copyleft engine, part of the licence audit · **⏸** = held, see §8.

### 10.1 JSON
- [x] P0 JSON formatter / beautifier
- [x] P0 JSON validator (line/column errors)
- [x] P0 JSON minifier
- [x] P0 JSON ↔ CSV
- [x] P1 JSON tree viewer (collapsible, copy path)
- [x] P1 JSON escape / stringify
- [x] P1 JSON diff (structural)
- [x] P1 JSONPath tester
- [x] P1 JSON → SQL INSERT / CREATE TABLE
- [ ] P2 jq playground
- [ ] P2 JSONata tester
- [ ] P2 JSON Schema validator ⚠ (no remote `$ref`)
- [ ] P2 JSON → JSON Schema
- [x] P2 JSON → types (TS, Go, Rust, Java, Kotlin, C#, Swift, Zod, Python)
- [x] P2 JSON repair
- [ ] P2 JSON ↔ MessagePack / CBOR / BSON
- [ ] P2 JSON-LD ops ⚠ (inline contexts only)

### 10.2 YAML / TOML / XML / INI / CSV
- [x] P0 JSON ↔ YAML
- [x] P0 XML formatter
- [x] P0 XML ↔ JSON
- [x] P1 YAML validator / linter
- [x] P1 YAML formatter
- [x] P1 TOML ↔ JSON
- [x] P1 TOML ↔ YAML
- [x] P1 XML minifier
- [x] P1 XML well-formedness validator
- [ ] P2 TOML validator / formatter
- [ ] P2 XSD validator ⚠ (no remote imports)
- [ ] P2 XPath tester (XPath 1.0)
- [ ] P2 XSLT runner ⚠ (Chrome drops native XSLT Nov 2026; needs a WASM engine)
- [ ] P2 CSV viewer / table editor
- [ ] P2 CSV validator / linter
- [ ] P2 CSV ↔ TSV / change delimiter
- [ ] P2 CSV → Markdown / HTML table
- [ ] P2 CSV → SQL INSERT
- [ ] P2 Query CSV / JSON / Parquet with SQL **H**
- [ ] P2 INI ↔ JSON
- [ ] P2 .properties ↔ JSON / YAML

### 10.3 Encoders / decoders
- [x] P0 Base64 text encode/decode (incl. URL-safe)
- [x] P0 Base64 file / image ↔ data URI
- [x] P0 URL encode/decode
- [x] P0 HTML entity encode/decode
- [x] P0 JWT decoder
- [x] P0 String escape/unescape (JS, JSON, Java, C#, SQL, XML, CSV)
- [x] P0 Text ↔ binary
- [x] P1 Text ↔ hex / hexdump
- [x] P1 Unicode escape / code points
- [x] P1 Gzip/deflate text (Base64 output)
- [x] P1 NATO alphabet / Morse
- [ ] P2 JWT signer / verifier ⚠ (pasted keys only, no JWKS URL)
- [ ] P2 Base32 / 58 / 62 / 85 / 45 / Bech32
- [ ] P2 Punycode / IDN
- [ ] P2 Charset transcoding (Shift_JIS, Windows-1252…)
- [ ] P2 Quoted-printable / MIME header decode
- [ ] P2 Basic-auth header generator
- [ ] P2 Outlook Safelinks decoder
- [ ] P2 String obfuscator (mask secrets)
- [ ] P2 URL defang / fang
- [ ] P2 Protobuf decoder
- [ ] P2 ASN.1 / DER parser
- [ ] P2 Novelty encodings (Rison, Braille, leetspeak…)
- [ ] P2 Text-integer / BCD / VarInt

### 10.4 Hashing and crypto
- [x] P0 Text hash generator (MD5, SHA-1/2/3, BLAKE2/3, xxHash…)
- [x] P0 UUID generator (v1/v4/v7, bulk)
- [x] P0 Password generator
- [x] P0 Text encrypt/decrypt (AES-GCM/CBC/CTR)
- [x] P1 File checksum (streaming, multi-GB)
- [x] P1 HMAC generator
- [x] P1 bcrypt hash / compare ⚠ (high cost = slow)
- [x] P1 ULID generator / decoder
- [x] P1 nanoid / random token generator
- [x] P1 RSA key pair generator
- [x] P1 X.509 certificate decoder ⚠ (pasted PEM only)
- [x] P1 TOTP/HOTP generator & validator
- [ ] P2 CRC32 / CRC64 / Adler-32
- [ ] P2 Argon2 / scrypt / PBKDF2 ⚠ (high memory cost may fail on mobile)
- [x] P2 UUID decoder
- [x] P2 Password strength estimator
- [ ] P2 EC / Ed25519 / X25519 key pairs
- [x] P2 SSH key generator / fingerprint
- [x] P2 CSR decoder
- [x] P2 CSR / self-signed certificate generator
- [x] P2 PEM ↔ DER ↔ JWK converter
- [ ] P2 RSA/ECDSA sign & verify, RSA encrypt/decrypt
- [x] P2 PGP keygen / encrypt / sign / verify ©
- [ ] P2 BIP39 mnemonic generator
- [x] P2 Hash type identifier

### 10.5 Text
- [x] P0 Text diff / compare
- [x] P0 Regex tester ⚠ (JavaScript regex flavour)
- [x] P0 Case converter
- [x] P0 Lorem ipsum generator
- [x] P0 Text statistics / word count
- [x] P0 Line tools: sort, dedupe, reverse, shuffle, trim
- [x] P1 List comparer / set operations
- [x] P1 Whitespace / line-break cleanup
- [x] P1 Line numbers, prefix/suffix, wrap
- [x] P2 Slugify
- [ ] P2 Find & replace (regex, multi-rule)
- [ ] P2 Extract emails / URLs / IPs / dates
- [ ] P2 Unicode inspector / normalise / remove diacritics
- [ ] P2 Invisible / zero-width character detector
- [ ] P2 Levenshtein / Hamming distance
- [x] P2 ASCII art banner (FIGlet)
- [ ] P2 Emoji picker / search
- [ ] P2 Numeronym generator
- [x] P2 ANSI escape remover / ANSI → HTML
- [x] P2 Markdown table generator
- [x] P2 Fake data generator
- [x] P2 Regex cheatsheet

### 10.6 Date and time
- [x] P0 Unix timestamp ↔ date
- [x] P1 Multi-format date parser / formatter
- [x] P1 Cron expression parser / builder
- [ ] P2 Timezone converter
- [ ] P2 Duration / date-diff calculator
- [ ] P2 Special epochs (FILETIME, LDAP, ObjectID, Snowflake)
- [x] P2 Week number / day-of-year
- [x] P2 ETA calculator
- [x] P2 Stopwatch

### 10.7 Web and HTTP
- [x] P1 URL parser
- [x] P1 User-agent parser
- [ ] P2 Query-string builder / editor
- [ ] P2 HTTP status code reference
- [ ] P2 MIME type lookup
- [x] P2 cURL → code (javascript, shell, python only)
- [ ] P2 HTTP header / CSP analyser (pasted headers)
- [ ] P2 Set-Cookie / Cookie parser
- [ ] P2 HAR file viewer
- [ ] P2 OpenAPI / Swagger viewer & validator ⚠ ("Try it out" disabled)
- [ ] P2 Meta tag / Open Graph generator
- [ ] P2 HTML WYSIWYG editor
- [ ] P2 Device / browser info
- [ ] P2 Keycode info

### 10.8 Network calculators
- [x] P0 IPv4 subnet / CIDR calculator
- [x] P0 IP address format converter
- [x] P1 IPv6 tools
- [x] P1 IP range ↔ CIDR / merger
- [x] P1 MAC address generator / formatter
- [ ] P2 MAC vendor (OUI) lookup ⚠ (bundled data, goes stale)
- [ ] P2 Random port generator

### 10.9 Code formatting and transforms
- [x] P0 SQL formatter
- [x] P0 Markdown preview
- [x] P0 Markdown → HTML
- [x] P1 JS / TS formatter
- [x] P1 JS minifier
- [x] P1 CSS formatter
- [x] P1 CSS minifier
- [x] P1 chmod calculator
- [ ] P2 SQL minifier
- [ ] P2 HTML formatter
- [ ] P2 HTML minifier
- [ ] P2 GraphQL formatter
- [ ] P2 Other formatters (PHP, Lua, Java…)
- [ ] P2 HTML → Markdown
- [ ] P2 Mermaid diagram renderer
- [ ] P2 Code → image (syntax-highlighted PNG/SVG)
- [ ] P2 HTML/SVG → JSX, SVG → React Native
- [ ] P2 CSS → JS object / Tailwind
- [ ] P2 TS → JS / JSON Schema / Zod **H**
- [ ] P2 JSON Schema → TS / Zod / OpenAPI / Protobuf
- [ ] P2 GraphQL → TS types
- [ ] P2 docker run → docker-compose
- [ ] P2 Dockerfile linter ⚠ (smaller rule set than hadolint)
- [ ] P2 Kubernetes YAML validator ⚠ (2–3 k8s versions, no CRDs)
- [ ] P2 .env parser / validator / ↔ JSON
- [ ] P2 .gitignore generator
- [ ] P2 Git cheatsheet

### 10.10 Numbers, colour, misc
- [x] P0 Number base converter
- [x] P0 Unit converter
- [x] P0 Colour converter (HEX/RGB/HSL/LAB/OKLCH)
- [x] P0 QR code generator
- [x] P1 Bitwise calculator
- [x] P1 Math expression evaluator
- [x] P1 QR decoder (image / camera)
- [ ] P2 IEEE-754 float inspector
- [ ] P2 Endianness swapper
- [ ] P2 Roman numeral converter
- [ ] P2 Percentage calculator
- [ ] P2 Semver compare / range tester
- [ ] P2 WCAG / APCA contrast checker
- [ ] P2 Colour-blindness simulator
- [ ] P2 Screen eyedropper ⚠ (Chromium only)
- [ ] P2 Palette extractor from image
- [ ] P2 CSS unit converter
- [ ] P2 CSS generators (gradient, shadow, cubic-bezier, clamp)
- [ ] P2 WiFi QR generator
- [ ] P2 Barcode generator
- [ ] P2 Barcode decoder
- [ ] P2 SVG placeholder image generator
- [ ] P2 Phone number parser / formatter
- [ ] P2 IBAN validator

### 10.11 Images
- [x] P0 Format converter (PNG/JPEG/WebP/AVIF/JXL/QOI) ⚠ (AVIF encode slow on large images)
- [x] P0 Image ↔ Base64 data URI *(same Tool as 10.3 Base64 file)*
- [x] P0 Compressor with before/after — ships without PNG palette reduction; that mode ⏸ **held: licence** (GPL libimagequant)
- [x] P0 Resize
- [x] P1 Crop / rotate / flip
- [x] P1 Add text / watermark / pixelate region
- [ ] P2 Adjust / filters
- [ ] P2 EXIF / metadata viewer
- [ ] P2 EXIF / metadata stripper
- [ ] P2 SVG optimiser
- [ ] P2 SVG → PNG/JPG ⚠ (external fonts/images not loaded)
- [ ] P2 Raster → SVG trace ⚠ (limited quality)
- [ ] P2 Favicon / ICO generator
- [ ] P2 HEIC/HEIF → JPEG/PNG **H** ©
- [ ] P2 Image compare / diff
- [ ] P2 GIF maker / frame extractor ⚠
- [ ] P2 OCR (image → text) **H**
- [ ] P2 Background removal **H** ©
- [ ] P2 Screenshot beautifier / device mockup

### 10.12 PDF
- [x] P0 Merge PDFs
- [x] P0 Split / extract pages
- [x] P0 Rotate pages
- [x] P0 Reorder / delete pages (page organiser)
- [x] P0 Images → PDF
- [x] P0 Password protect (AES-256)
- [x] P0 Unlock (known password) / remove permissions
- [x] P0 Compress **H** © (MuPDF) ⏸ **held: licence**
- [x] P1 PDF → images
- [x] P1 Validate digital signature ⚠ (no online revocation check)
- [ ] P2 Extract text ⚠ (scanned PDFs need OCR)
- [ ] P2 Extract images
- [ ] P2 Sign (visual signature)
- [ ] P2 Digital signature with certificate (.p12) ⚠ (no TSA timestamp)
- [ ] P2 Annotate / add text / add image
- [ ] P2 Watermark / stamp
- [ ] P2 Page numbers
- [ ] P2 Edit metadata
- [ ] P2 Fill forms / flatten ⚠ (no XFA)
- [ ] P2 Redact (true removal) **H** © (MuPDF)
- [x] P2 OCR → searchable PDF **H**
- [ ] P2 Compare PDFs (text-level)
- [ ] P2 PDF info / inspector
- [ ] P2 Remove blank pages
- [ ] P2 N-up / booklet
- [ ] P2 Crop / resize pages
- [ ] P2 Manage attachments
- [ ] P2 Edit bookmarks / TOC
- [ ] P2 Repair damaged PDF **H** © (MuPDF)

### 10.13 Office and documents
- [x] P2 CSV ↔ XLSX
- [ ] P2 XLSX viewer / → JSON / → HTML
- [ ] P2 DOCX → HTML / Markdown ⚠ (semantic, not pixel-exact)
- [ ] P2 Markdown → DOCX
- [ ] P2 Universal converter (pandoc) **H** ©
- [x] P2 Markdown / HTML → PDF (print engine)
- [ ] P2 Parquet / Avro viewer
- [x] P2 SQLite database browser

### 10.14 Audio and video
- [ ] P2 Video format convert **H** ⚠ (2 GB)
- [ ] P2 Trim / cut video or audio **H**
- [ ] P2 Extract audio from video **H**
- [x] P2 Video → GIF **H**
- [ ] P2 Compress video **H**
- [x] P2 Audio convert / trim **H**
- [x] P2 Media info
- [ ] P2 Screen recorder ⚠ (not on mobile)
- [ ] P2 Camera recorder / photo

### 10.15 Archives and compression
- [x] P1 Gzip / gunzip a file
- [ ] P2 Zip create / extract
- [ ] P2 Tar / untar (+ .tar.gz)
- [ ] P2 7z / RAR / bzip2 / xz extract ⚠ (RAR read-only)
- [ ] P2 Archive browser
- [ ] P2 LZ4 / LZMA / zstd / brotli
- [ ] P2 Extract to folder ⚠ (Chromium only; elsewhere re-zip)

### 10.16 Forensics, binary and platform features
- [x] P1 **Pipeline / recipe chaining** (platform feature: chain Tools, e.g. Base64 → gunzip → JSON format)
- [ ] P2 File-type detector (magic bytes)
- [ ] P2 Hex viewer / editor
- [x] P2 Strings extractor
- [ ] P2 Entropy / byte histogram
- [x] P2 Auto-detect encoding ("Magic")
- [x] P2 JS benchmark builder
- [ ] P2 Shareable state via URL fragment ⚠ (off by default, stays in browser history)

---

## 11. Permanently excluded (need the network, see ADR 0001)

Remote header/CORS checker · HTTP request client · WebSocket tester · DNS lookup · WHOIS/RDAP · remote SSL/TLS checker · what's-my-IP / port scan / ping · live link/sitemap checker · URL→PDF / website screenshot · high-fidelity PDF ↔ Office conversion (no client-side engine exists).
