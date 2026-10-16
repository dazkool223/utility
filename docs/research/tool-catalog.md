# Client-side developer utility platform: tool catalog

Research date: 2026-10-15. Scope: candidate tools for a fully browser-based, zero-server-storage utility platform. This is a list to approve or reject, not a build plan.

## 0. How to read this

**Seen in** codes (survey sources in section 1):

| Code | Project | Tool-list source used | Licence |
|---|---|---|---|
| IT | IT-Tools | https://github.com/CorentinTh/it-tools/blob/main/src/tools/index.ts | GPL-3.0 |
| DT | DevToys 2.x (30 built-in tools) | https://devtoys.app/ , https://github.com/DevToys-app/DevToys | MIT |
| CC | CyberChef (~400 operations in 17 categories) | https://github.com/gchq/CyberChef/blob/master/src/core/config/Categories.json | Apache-2.0 |
| SQ | Squoosh | https://github.com/GoogleChromeLabs/squoosh/tree/dev/codecs | Apache-2.0 |
| SP | Stirling-PDF | https://docs.stirlingpdf.com/Tools/ | open-core (see repo LICENSE) |
| TT | transform.tools | https://github.com/ritz078/transform/blob/master/utils/routes.tsx | MIT |
| CB | CodeBeautify | https://codebeautify.org/ (homepage category list) | proprietary |

**Tier rule (mechanical):** P0 = tool appears in 3 or more surveyed projects. P1 = 2 projects. P2 = 0 or 1. Section 5 lists where I would override the count on product judgment. The count does not make those changes for you.

**Feasibility flags:** OK = runs fully client-side. CAVEAT = feasible with a stated limit. NO = needs a network call to a host other than our own, so it breaks the no-data-leaves-the-browser promise, or it can't be done client-side at all.

**Library licences and URLs** are in the library index (section 6). Tables use the short library name. Where a licence was not confirmed from the repo during this research, it is marked "(verify)".

Survey caveats:
- **CodeBeautify:** the homepage lists only categories ("JSON, XML, YAML, HTML, CSS, JavaScript, CSV, TSV, SQL Tools"; converters for "Image, Base64, Excel, Word, Date, Unit, Number, Color"; "Cryptography, Escape/Unescape, Encode/Decode"; "String Utilities, Number and Bitwise Tools, IP Tools"; "Compress/Decompress"; "Random Generators"), so CB attributions are category-level. The `/alltools` page returned 404.
- **Stirling-PDF:** processes on its own (self-hostable) server. Its list shows which features users expect, not what is feasible client-side. Its "Convert" tools are server-backed.
- **Squoosh:** says it "does not send your image to a server" but runs Google Analytics that records before and after image sizes (https://github.com/GoogleChromeLabs/squoosh). Do not copy that.
- **DevToys:** the default set is 30 tools. Third-party extensions (JSON Schema, ULID, Duplicate Detector) are marked "DT-ext".

---

## 1. Catalog

### 1.1 JSON (17)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| JSON formatter / beautifier | Pretty-print with an indent choice | `JSON.parse`/`JSON.stringify` (native); jsonc-parser (MIT) for comments and error offsets | OK. Big files (>50 MB) need a worker and a virtualised editor | IT, DT, CC, CB | P0 |
| JSON validator | Parse errors with line/column | jsonc-parser (MIT) or native error message | OK | IT, DT, CB | P0 |
| JSON minifier | Strip whitespace | native | OK | IT, CC, CB | P0 |
| JSON tree viewer / navigator | Collapsible tree, path copy | native + virtualised list (own UI) | OK | IT, CB | P1 |
| JSON ↔ CSV | Flatten an array of objects to CSV and back | PapaParse (MIT) | OK. Nested objects need a flatten policy | IT, DT, CC, CB | P0 |
| JSON escape / stringify | Escape JSON into a string literal and back | native | OK | CC, CB | P1 |
| JSON diff | Structural diff of two documents | jsondiffpatch (MIT) | OK | IT, CC (generic Diff) | P1 |
| JSONPath tester | Evaluate a JSONPath expression | jsonpath-plus (MIT) | OK. Engines disagree on edge cases; state which engine you use | DT, CC | P1 |
| jq playground | Run jq filters | jq (MIT) compiled to WASM, e.g. jq-web (verify) | CAVEAT: about 1 MB WASM | CC | P2 |
| JSONata tester | Run JSONata queries | jsonata (MIT) | OK | CC | P2 |
| JSON Schema validator | Validate a document against a schema (draft-07/2019-09/2020-12) | Ajv (MIT) | OK. Remote `$ref` needs a fetch, so bundle common metaschemas only | DT-ext | P2 |
| JSON → JSON Schema | Infer a schema from a sample | quicktype-core (Apache-2.0) | OK | TT | P2 |
| JSON → types (TS, Go, Rust, Java, Kotlin, C#, Swift, Zod, Python) | Generate typed models | quicktype-core (Apache-2.0); json-schema-to-typescript (MIT) | OK. quicktype bundle is large, so lazy-load it | TT | P2 |
| JSON → SQL INSERT / CREATE TABLE | Turn rows into SQL | own code | OK | TT (to MySQL), CB | P1 |
| JSON repair | Fix trailing commas, single quotes, comments | jsonrepair (ISC, verify) | OK | CB (JSON Fixer) | P2 |
| JSON ↔ binary formats (MessagePack, CBOR, BSON) | Encode and decode | @msgpack/msgpack (ISC), cbor-x (MIT), bson (Apache-2.0) | OK | CC | P2 |
| JSON-LD ops (expand, compact, flatten, frame, N-Quads) | Linked-data transforms | jsonld.js (BSD-3-Clause) | CAVEAT: remote `@context` URLs need a fetch. Use inline contexts or a document loader with only bundled contexts | TT | P2 |

### 1.2 YAML / TOML / XML / INI / CSV (21)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| JSON ↔ YAML | Convert both ways | yaml (ISC) or js-yaml (MIT) | OK. Comments are lost going YAML→JSON. Anchors are expanded | IT, DT, CC, TT, CB | P0 |
| YAML validator / linter | Syntax errors, duplicate keys, positions | yaml (ISC), which reports errors with line/col | OK. This is not yamllint (Python), so its rule set is smaller | IT (viewer), CB | P1 |
| YAML formatter | Normalise indent and quoting | yaml (ISC) `stringify`, or Prettier YAML plugin (MIT) | OK | IT, CB | P1 |
| TOML ↔ JSON | Convert both ways | smol-toml (BSD-3-Clause) | OK. TOML date types become strings | IT, TT | P1 |
| TOML ↔ YAML | Convert both ways | smol-toml + yaml | OK | IT, TT | P1 |
| TOML validator / formatter | Parse errors, reformat | smol-toml | OK | none | P2 |
| XML formatter | Pretty-print | xml-formatter (MIT) or native `DOMParser` + serializer | OK | IT, DT, CC, CB | P0 |
| XML minifier | Strip insignificant whitespace | own code on `DOMParser` | OK | CC, CB | P1 |
| XML well-formedness validator | Parse errors | native `DOMParser` (`parsererror`) or fast-xml-parser `XMLValidator` (MIT) | OK | DT, CB | P1 |
| XML ↔ JSON | Convert both ways | fast-xml-parser (MIT) | OK. Pick an attribute and array convention | IT, TT, CB | P0 |
| XSD validator | Validate XML against XSD | xmllint-wasm (libxml2, MIT, verify) | CAVEAT: WASM about 1–2 MB; `xs:import` of remote schemas is not fetched | DT | P2 |
| XPath tester | Evaluate XPath 1.0 | native `document.evaluate` | OK, XPath 1.0 only | CC | P2 |
| XSLT runner | Apply an XSLT 1.0 stylesheet | native `XSLTProcessor` | CAVEAT: Chrome is removing XSLT. It "stops functioning on Stable releases" in Chrome 158 (17 Nov 2026) and is fully off in Chrome 176 (https://developer.chrome.com/docs/web-platform/deprecating-xslt). A WASM build (libxslt) would be needed | none | P2 |
| CSV viewer / table editor | Grid view, sort, filter | PapaParse (MIT) + virtualised grid | OK. For >100 MB use a streaming parse in a worker | CB | P2 |
| CSV validator / linter | Ragged rows, quoting errors, encoding | PapaParse error output | OK | CB | P2 |
| CSV ↔ TSV / change delimiter | Re-delimit | PapaParse | OK | CB | P2 |
| CSV → Markdown / HTML table | Render a table | own code | OK | none | P2 |
| CSV → SQL INSERT | Generate SQL | own code | OK | CB (SQL tools) | P2 |
| Query CSV/JSON/Parquet with SQL | Ad-hoc SQL over local files | DuckDB-WASM (MIT); sql.js (MIT) for SQLite | CAVEAT: DuckDB-WASM is about 30 MB+ to download and "might not have the same level of support for out-of-core operations" (repo README) | none | P2 |
| INI ↔ JSON | Parse and convert INI | ini (ISC) | OK | none | P2 |
| .properties ↔ JSON/YAML | Java properties conversion | own code (simple grammar) | OK | none | P2 |

### 1.3 Encoders / decoders (24)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Base64 text encode/decode | Includes the URL-safe variant and UTF-8 | `TextEncoder` + `btoa`/`atob` (native) | OK | IT, DT, CC, CB | P0 |
| Base64 file / image ↔ data URI | File to Base64 and Base64 to downloadable file | `FileReader.readAsDataURL`, `Blob` (native) | OK. Large files inflate 33% in memory | IT, DT, CC, CB | P0 |
| URL encode/decode | Percent-encoding (component vs full URI) | `encodeURIComponent` etc. (native) | OK | IT, DT, CC, CB | P0 |
| HTML entity encode/decode | Named and numeric entities | he (MIT) | OK | IT, DT, CC, CB | P0 |
| JWT decoder | Header and payload decode, exp/iat to human time | jose (MIT) `decodeJwt`, or plain base64url | OK | IT, DT, CC, CB | P0 |
| JWT signer / verifier | HS/RS/ES/EdDSA sign and verify | jose (MIT) on Web Crypto | OK. Verifying with a JWKS URL is NO (it needs a fetch), so accept pasted keys only | CC | P2 |
| String escape/unescape (JS, JSON, Java, C#, SQL, XML, CSV) | Escape string literals per language | own code | OK | DT, CC, CB | P0 |
| Text ↔ binary | ASCII/UTF-8 to bit strings | native | OK | IT, CC, CB | P0 |
| Text ↔ hex / hexdump | Hex encoding and dump | native | OK | CC, CB | P1 |
| Unicode escape (\uXXXX, \u{...}, code points) | Escape and unescape | native (`codePointAt`) | OK | IT, CC | P1 |
| GZip/deflate of text (Base64 output) | Compress or decompress a pasted string | `CompressionStream`/`DecompressionStream` (native, Baseline since May 2023: https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API) | OK. Native formats are gzip/deflate/deflate-raw only | DT, CC | P1 |
| NATO alphabet / Morse | Text to phonetic or Morse | own code | OK | IT, CC | P1 |
| Base32 / Base58 / Base62 / Base85 / Base45 / Bech32 | Alternative alphabets | own code or small libs (e.g. @scure/base, MIT) | OK | CC | P2 |
| Punycode / IDN | Unicode domain ↔ `xn--` | `new URL()` hostname (native, to ASCII); punycode.js (MIT) for decode | OK | CC | P2 |
| Charset transcoding (Shift_JIS, Windows-1252...) | Decode bytes in a legacy encoding | `TextDecoder` (native, many labels) | CAVEAT: `TextEncoder` only writes UTF-8, so encoding to legacy charsets needs a lib (iconv-lite, MIT) | CC | P2 |
| Quoted-printable / MIME header decode | Email encodings | own code | OK | CC | P2 |
| Basic-auth header generator | user:pass → `Authorization: Basic` | native | OK | IT | P2 |
| Outlook Safelinks decoder | Unwrap a Safelinks URL | `URL` (native) | OK | IT | P2 |
| String obfuscator | Partially mask a secret for sharing | own code | OK | IT | P2 |
| URL defang / fang | `hxxp://example[.]com` | own code | OK | CC | P2 |
| Protobuf decode (schemaless or with .proto) | Inspect protobuf bytes | protobufjs (BSD-3-Clause) | OK | CC | P2 |
| ASN.1 / DER parser | Tree view of DER/BER | asn1js (BSD-3-Clause) | OK | CC | P2 |
| Rison / Caret / Braille / leetspeak etc. | Novelty encodings | own code | OK | CC | P2 |
| Text-integer / BCD / VarInt | Numeric encodings | own code | OK | CC | P2 |

### 1.4 Hashing and crypto (25)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Text hash generator (MD5, SHA-1/2/3, RIPEMD, BLAKE2/3, xxHash, SM3, Whirlpool) | All digests of input text | hash-wasm (MIT, verify); `SubtleCrypto.digest` covers only SHA-1/256/384/512 (https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) | OK. MD5 and SHA-3 are not in Web Crypto, so a lib is required | IT, DT, CC, CB | P0 |
| File checksum (streaming) | Hash multi-GB files without loading them whole | hash-wasm incremental API + `Blob.stream()` | OK. Streaming avoids memory limits | DT, CC | P1 |
| CRC32 / CRC64 / Adler-32 / Fletcher | Checksums | hash-wasm | OK | CC | P2 |
| HMAC generator | HMAC with any hash | `SubtleCrypto` HMAC (SHA family); hash-wasm for MD5/SHA-3 HMAC | OK | IT, CC | P1 |
| bcrypt hash / compare | Generate and verify bcrypt | bcryptjs (BSD-3-Clause, verify) or hash-wasm | CAVEAT: pure JS is about 30% slower than native (bcrypt.js README). Each extra cost step doubles time, so cost 14+ takes seconds: run it in a worker. Input is limited to 72 bytes and not enforced | IT, CC | P1 |
| Argon2 / scrypt / PBKDF2 | KDF hashing | hash-wasm (Argon2, scrypt); `SubtleCrypto` PBKDF2 | CAVEAT: high Argon2 memory cost (1 GB+) can fail on mobile | CC | P2 |
| UUID generator (v1/v4/v7, bulk) | Generate UUIDs | `crypto.randomUUID()` (native, v4, secure context); uuid (MIT) for v1/v6/v7 | OK | IT, DT, CC, CB | P0 |
| UUID decoder | Version, variant, embedded timestamp | own code | OK | CC | P2 |
| ULID generator / decoder | Sortable IDs | ulid (MIT) | OK | IT, DT-ext | P1 |
| nanoid / random token generator | Custom alphabet and length | nanoid (MIT); `crypto.getRandomValues` | OK | IT, CB (random generators) | P1 |
| Password generator | Rules: length, classes, exclude ambiguous, passphrase | `crypto.getRandomValues` (native) | OK. Use rejection sampling, not `%`, to avoid modulo bias | IT, DT, CB | P0 |
| Password strength estimator | Entropy and crack-time estimate | @zxcvbn-ts/core (MIT) | OK. The dictionaries are a few MB, so lazy-load them | IT | P2 |
| Text encrypt/decrypt (AES-GCM/CBC/CTR) | Passphrase-based encryption | `SubtleCrypto` (AES + PBKDF2) | OK. Legacy ciphers (DES, 3DES, RC4, Blowfish) need crypto-js (MIT, discontinued), so treat them as P2 | IT, CC, CB | P0 |
| RSA key pair generator | PEM (PKCS#8/SPKI), JWK, OpenSSH | `SubtleCrypto.generateKey` + `exportKey` | OK. 4096-bit generation takes a few seconds. OpenSSH format needs own encoder | IT, CC | P1 |
| EC / Ed25519 / X25519 key pairs | ECDSA P-256/384/521, Ed25519 | `SubtleCrypto` (Ed25519/X25519 now listed on MDN); @noble/curves (MIT) as fallback | CAVEAT: check Ed25519 support per browser | CC | P2 |
| SSH key generator / fingerprint | OpenSSH-format keys, SHA256 fingerprints | Web Crypto + own OpenSSH wire-format encoder | OK | none | P2 |
| X.509 certificate decoder | Subject, SAN, validity, extensions, fingerprints | @peculiar/x509 (MIT) or pkijs (BSD-3-Clause) | OK. Pasted PEM only; fetching a live host's cert is NO | DT, CC | P1 |
| CSR decoder | Parse a PKCS#10 CSR | @peculiar/x509 | OK | CC | P2 |
| CSR / self-signed cert generator | Build a CSR or self-signed cert | @peculiar/x509 + Web Crypto | OK | none | P2 |
| PEM ↔ DER ↔ JWK converter | Key/cert format conversion | asn1js, jose `exportJWK` | OK | CC | P2 |
| RSA/ECDSA sign & verify, RSA encrypt/decrypt | Raw ops with pasted keys | `SubtleCrypto` | OK | CC | P2 |
| PGP keygen / encrypt / sign / verify | OpenPGP | openpgp.js (LGPL-3.0-or-later) | OK. Mind LGPL for bundling | CC | P2 |
| TOTP/HOTP generator & validator | 2FA codes from a secret, plus otpauth QR | otpauth (MIT) | OK | IT, CC | P1 |
| BIP39 mnemonic generator | Seed phrases | bip39 (ISC) or @scure/bip39 (MIT) | OK | IT | P2 |
| Hash type identifier | Guess hash type from length and format | own code | OK | CC | P2 |

### 1.5 Text (22)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Text diff / compare | Side-by-side and inline diff | Monaco diff editor (MIT) or jsdiff (BSD-3-Clause) / diff-match-patch (Apache-2.0) | OK | IT, DT, CC, CB | P0 |
| Regex tester | Live matches, groups, replace, flags | native `RegExp` | CAVEAT: JS flavour only (PCRE/Python/Go would need WASM engines). Catastrophic backtracking can freeze the tab, so run it in a worker with a timeout | IT, DT, CC | P0 |
| Regex cheatsheet | Reference | static content | OK | IT | P2 |
| Case converter | camel/snake/kebab/Pascal/CONSTANT/title/sentence | change-case (MIT) | OK | IT, DT, CC, CB | P0 |
| Lorem ipsum generator | Words, sentences, paragraphs | lorem-ipsum (MIT, verify) or own | OK | IT, DT, CB | P0 |
| Text statistics / word count | Chars, words, lines, bytes, reading time | `Intl.Segmenter` (native) for grapheme and word counts | OK | IT, DT, CB | P0 |
| Line tools: sort, dedupe, reverse, shuffle, trim | Per-line operations | native | OK | DT, CC, CB | P0 |
| List comparer / set ops | Union, intersection, difference of two lists | native `Set` | OK | DT, CC | P1 |
| Whitespace / line-break cleanup | Remove extra spaces, empty lines, tabs ↔ spaces | native | OK | CC, CB | P1 |
| Slugify | Text to URL slug | @sindresorhus/slugify (MIT) | OK | IT | P2 |
| Find & replace (regex, multi-rule) | Batch replacements | native | OK | CC | P2 |
| Add/remove line numbers, prefix/suffix, wrap | Line decoration and wrap | native | OK | IT (list converter), CC | P1 |
| Extract emails / URLs / IPs / dates | Pattern extractors | native `RegExp` | OK | CC | P2 |
| Unicode inspector / normalise (NFC/NFD), remove diacritics | Show code points and normalise | `String.prototype.normalize` (native) | OK | CC | P2 |
| Invisible / zero-width char detector | Find homoglyphs and hidden chars | own code | OK | none | P2 |
| Levenshtein / Hamming distance | String similarity | own code | OK | CC | P2 |
| ASCII art banner (FIGlet) | Big text banners | figlet (MIT) | OK. Fonts add size | IT | P2 |
| Emoji picker / search | Find and copy emoji | emojibase (MIT) data | OK | IT | P2 |
| Numeronym generator | i18n-style abbreviations | own code | OK | IT | P2 |
| ANSI escape remover / ANSI → HTML | Clean or render terminal logs | ansi_up (MIT) or regex | OK | CC | P2 |
| Markdown table generator | Build tables in a grid | own code | OK | none | P2 |
| Fake data generator | Names, addresses, emails as JSON/CSV | @faker-js/faker (MIT) | OK. Large bundle; import per locale | CB (random generators) | P2 |

### 1.6 Date and time (9)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Unix timestamp ↔ date | s/ms/µs/ns epoch to local, UTC and ISO, and back | native `Date`, `Intl.DateTimeFormat` | OK | IT, DT, CC, CB | P0 |
| Multi-format date parser / formatter (ISO 8601, RFC 2822/3339) | Parse any format, output many | Temporal (native where shipped) or @js-temporal/polyfill (ISC); date-fns (MIT) | OK | IT, CC | P1 |
| Cron expression parser / builder | Human description plus next N runs | cronstrue (MIT) + croner (MIT) | OK. Dialects differ (Quartz 6/7-field, AWS); label them | IT, DT | P1 |
| Timezone converter | Time across zones, DST-aware | `Intl.DateTimeFormat` with `timeZone`; `Intl.supportedValuesOf('timeZone')` | OK. Uses the browser's built-in tzdata | CC (Translate DateTime Format) | P2 |
| Duration / date-diff calculator | Difference between dates, ISO 8601 durations | Temporal / date-fns | OK | CC (DateTime Delta) | P2 |
| Other epoch formats (Windows FILETIME, LDAP, Mongo ObjectID, Snowflake IDs) | Decode special timestamps | BigInt (native) | OK | CC | P2 |
| ETA calculator | Time to finish from rate | own code | OK | IT | P2 |
| Stopwatch / chronometer | Timer | native | OK | IT | P2 |
| Week number / day-of-year | ISO week and day calc | Temporal / date-fns | OK | none | P2 |

### 1.7 Web and HTTP (23)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| URL parser | Split into scheme/host/port/path/query/fragment | `URL` (native) | OK | IT, CC | P1 |
| Query-string builder/editor | Edit params as a table, rebuild URL | `URLSearchParams` (native) | OK | none | P2 |
| User-agent parser | Browser/OS/device from a UA string | bowser (MIT) or ua-parser-js **v1 (MIT)** | CAVEAT: ua-parser-js **v2 is AGPL-3.0** (https://github.com/faisalman/ua-parser-js) | IT, CC | P1 |
| HTTP status code reference | Searchable list with meaning | static data (statuses, MIT) | OK | IT | P2 |
| MIME type lookup | Extension ↔ MIME | mime-db (MIT) | OK | IT | P2 |
| cURL → code | Convert a curl command to fetch/Python/Go etc. | curlconverter (MIT), which needs tree-sitter WASM files hosted (https://github.com/curlconverter/curlconverter) | OK | none (curlconverter.com is standalone) | P2 |
| HTTP header / CSP analyser (pasted) | Explain pasted response headers and grade security headers | own code | OK for pasted text | none | P2 |
| Set-Cookie / Cookie parser | Decode cookie attributes | own code | OK | none | P2 |
| HAR file viewer | Waterfall and request inspector for .har | own code | OK | none | P2 |
| OpenAPI / Swagger viewer & validator | Render and validate specs | swagger-ui (Apache-2.0) or Redoc (MIT); @apidevtools/swagger-parser (MIT) | CAVEAT: disable swagger-ui "Try it out" (it sends requests) and remote `$ref` | none | P2 |
| Meta tag / Open Graph generator | Build head tags plus a preview | own code | OK | IT | P2 |
| HTML WYSIWYG editor | Rich text to HTML | TipTap (MIT) | OK | IT | P2 |
| Device / browser info | Screen, UA, languages, features | `navigator`, `screen` (native) | OK | IT | P2 |
| Keycode info | `key`/`code`/`keyCode` of pressed keys | `KeyboardEvent` (native) | OK | IT | P2 |
| Remote CORS / security-header checker | Fetch a URL and inspect its headers | none | **NO**: CORS hides most response headers unless the server sends `Access-Control-Expose-Headers`, and it needs a request to a third party. Offer the pasted-headers analyser instead | none | — |
| HTTP request client (Postman-like) | Send arbitrary requests | `fetch` | **NO / CAVEAT**: CORS blocks most targets, and it contradicts `connect-src 'self'`. Possible only as an explicit opt-in, user-initiated egress | CC (HTTP request) | — |
| WebSocket tester | Connect and send frames | `WebSocket` | **NO / CAVEAT**: same as above; `connect-src` governs WebSocket | none | — |
| DNS lookup | A/AAAA/MX/TXT records | DNS-over-HTTPS JSON APIs (Cloudflare/Google) | **NO**: the queried domain goes to a third-party resolver | CC (DNS over HTTPS) | — |
| WHOIS / RDAP | Domain registration data | RDAP servers | **NO**: third-party request; CORS support varies | none | — |
| Remote SSL/TLS checker | Cert chain and ciphers of a host | none | **NO**: browsers don't expose raw TLS. Decode a pasted cert instead | none | — |
| What's my IP / port scan / ping | Network diagnostics | none | **NO**: needs a server; raw sockets are unavailable | none | — |
| Link / sitemap / robots.txt checker of a live site | Crawl a site | none | **NO**: CORS plus third-party egress. Generators for robots.txt and sitemap from pasted input are OK (P2) | none | — |
| URL-to-PDF / website screenshot | Render a remote page | none | **NO**: cross-origin pages can't be rasterised | SP (URL to PDF, server-side) | — |

### 1.8 Network calculators (7)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| IPv4 subnet / CIDR calculator | Network, broadcast, mask, host range, count | ipaddr.js (MIT) or ip-address (MIT) | OK | IT, CC, CB | P0 |
| IP address format converter | Dotted ↔ decimal ↔ hex ↔ binary, IPv4-mapped IPv6 | ipaddr.js | OK | IT, CC, CB | P0 |
| IPv6 tools | Expand/compress, ULA generator, transition addresses | ip-address (MIT) | OK | IT, CC | P1 |
| IP range expander / CIDR merger | Range ↔ CIDR list, aggregate | ip-address | OK | IT, CC | P1 |
| MAC address generator / formatter | Random MACs, notation changes | own code | OK | IT, CC | P1 |
| MAC vendor (OUI) lookup | Vendor from prefix | bundled IEEE OUI registry | CAVEAT: data is a few MB and goes stale; check IEEE terms for redistribution | IT | P2 |
| Random port generator | Pick an unused-looking port | own code | OK | IT | P2 |

### 1.9 Code formatting and transforms (27)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| SQL formatter | Dialect-aware SQL pretty-print | sql-formatter (MIT) | OK | IT, DT, CC, CB | P0 |
| SQL minifier | Collapse SQL | sql-formatter tokenizer or own | OK | CC | P2 |
| JS / TS formatter | Prettier formatting | Prettier standalone + plugins (MIT) (https://prettier.io/docs/browser) | OK. Plugins are about 1–3 MB, so lazy-load them | CC, CB | P1 |
| JS minifier | Minify JS | Terser (BSD-2-Clause) or esbuild-wasm (MIT) | OK | CC, CB | P1 |
| CSS formatter | Pretty-print CSS/SCSS/Less | Prettier (MIT) | OK | CC, CB | P1 |
| CSS minifier | Minify CSS | lightningcss-wasm (MPL-2.0) or csso (MIT) | OK | CC, CB | P1 |
| HTML formatter | Pretty-print HTML | Prettier HTML plugin (MIT) | OK | CB | P2 |
| HTML minifier | Minify HTML | html-minifier-terser (MIT) | OK | CB | P2 |
| GraphQL formatter | Format queries and SDL | Prettier GraphQL plugin (MIT) or graphql-js `print` (MIT) | OK | none | P2 |
| Other-language formatters (PHP, Lua, Java, XML, YAML) | More beautifiers | Prettier community plugins (e.g. @prettier/plugin-php, MIT) | OK, per plugin | CB | P2 |
| Markdown preview | Live GFM preview | marked (MIT) or markdown-it (MIT) + DOMPurify (MPL-2.0 OR Apache-2.0) | OK. Always sanitise | IT, DT, CC | P0 |
| Markdown → HTML | Export HTML | marked / markdown-it | OK | IT, TT, CB | P0 |
| HTML → Markdown | Convert HTML to Markdown | turndown (MIT) | OK | CB | P2 |
| Mermaid diagram renderer | Render diagrams to SVG/PNG | mermaid (MIT) | OK. Large bundle | none | P2 |
| Syntax highlighter / code → image | Highlighted code as PNG/SVG ("Carbon"-style) | Shiki (MIT) + html-to-image (MIT) | OK. Fonts must be self-hosted to keep `connect-src 'self'` | CC (syntax highlighter) | P2 |
| JSON/HTML/SVG → JSX, SVG → React Native | Front-end snippets | own HTML→JSX transform; @svgr/core (MIT) | CAVEAT: confirm the SVGR browser build (verify) | TT | P2 |
| CSS → JS object / Tailwind | CSS transforms | postcss (MIT) + own mapping | OK | TT | P2 |
| TS → JS / TS → JSON Schema / TS → Zod | Type transforms | TypeScript compiler (Apache-2.0) in a worker; ts-to-zod (MIT, verify) | CAVEAT: the `typescript` package is about 10 MB | TT | P2 |
| JSON Schema → TS / Zod / OpenAPI / Protobuf | Schema transforms | json-schema-to-typescript (MIT); quicktype-core (Apache-2.0) | OK | TT | P2 |
| GraphQL → TS types / introspection | GraphQL codegen | @graphql-codegen/core (MIT) + graphql (MIT) | CAVEAT: confirm browser bundling | TT | P2 |
| docker run → docker-compose | Convert a CLI command to compose YAML | composerize (MIT) | OK | IT | P2 |
| Dockerfile linter | Best-practice warnings | dockerfile-utils (MIT) | CAVEAT: hadolint (the de-facto tool) is Haskell with no maintained WASM build, so the rule set is smaller | none | P2 |
| Kubernetes YAML validator | Schema-validate manifests per k8s version | yaml (ISC) + Ajv (MIT) + bundled kubernetes-json-schema (Apache-2.0) | CAVEAT: schemas are large per version, so ship 2–3 versions; CRDs are unknown | none | P2 |
| .env parser / validator / ↔ JSON | Parse, find duplicates, convert | dotenv `parse` (BSD-2-Clause) | OK | none | P2 |
| .gitignore generator | Pick stacks, merge templates | github/gitignore templates (CC0-1.0) | OK | none | P2 |
| Git cheatsheet | Reference | static | OK | IT | P2 |
| chmod calculator | rwx ↔ octal ↔ symbolic | own code | OK | IT, CC | P1 |

### 1.10 Numbers, colour, misc dev (24)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Number base converter | bin/oct/dec/hex/any base, big numbers | `BigInt` (native) | OK | IT, DT, CC, CB | P0 |
| Bitwise calculator | AND/OR/XOR/NOT/shifts with bit view | `BigInt` | OK | CC, CB | P1 |
| IEEE-754 float inspector | Float ↔ bits | `DataView` (native) | OK | CC | P2 |
| Endianness swapper | Byte-order swap | `DataView` | OK | CC | P2 |
| Roman numeral converter | Roman ↔ Arabic | own code | OK | IT | P2 |
| Math expression evaluator | Calculator with units | mathjs (Apache-2.0) | OK. Don't use `eval` | IT, CC | P1 |
| Unit converter (data sizes, temperature, length...) | Unit conversions | mathjs units or own | OK | IT, CC, CB | P0 |
| Percentage calculator | Percent of, change | own code | OK | IT | P2 |
| Semver compare / range tester | Compare versions, test ranges | semver (ISC) | OK | none | P2 |
| Colour converter (HEX/RGB/HSL/HWB/LAB/OKLCH) | Convert and preview colours | culori (MIT) | OK | IT, CC, CB | P0 |
| WCAG / APCA contrast checker | Contrast ratio and pass/fail | culori `wcagContrast`; apca-w3 (verify licence) | OK | none | P2 |
| Colour-blindness simulator | Simulate CVD on an image | Canvas pixel matrices / SVG filters | OK | DT | P2 |
| Screen eyedropper | Pick a colour from anywhere on screen | `EyeDropper` API | CAVEAT: Chromium-only; hide elsewhere | none | P2 |
| Palette extractor from image | Dominant colours | Canvas + k-means (own) | OK | none | P2 |
| CSS unit converter (px/rem/em/vw/pt) | Convert CSS units | own code | OK | none | P2 |
| CSS generators (gradient, box-shadow, cubic-bezier, clamp) | Visual CSS builders | own code | OK | none | P2 |
| QR code generator | Text/URL/vCard to QR (PNG/SVG) | qrcode (MIT) | OK | IT, DT, CC, CB | P0 |
| WiFi QR generator | WIFI: payload QR | qrcode | OK | IT | P2 |
| QR decoder (image/camera) | Read QR from file or webcam | jsQR (Apache-2.0) or zxing-wasm (MIT); `getUserMedia` | CAVEAT: `BarcodeDetector` is "Limited availability", so don't rely on it (https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) | DT, CC | P1 |
| Barcode generator (Code128, EAN, UPC, DataMatrix, PDF417) | 1D/2D barcodes | bwip-js (MIT) or JsBarcode (MIT) | OK | none | P2 |
| Barcode decoder | Read 1D/2D barcodes | zxing-wasm (MIT) | OK | none | P2 |
| SVG placeholder image generator | WxH placeholder SVG/PNG | own code | OK | IT | P2 |
| Phone number parser / formatter | E.164, validation | libphonenumber-js (MIT) | OK | IT | P2 |
| IBAN validator / parser | Validate IBANs | ibantools (MPL-2.0) | OK | IT | P2 |

### 1.11 Images (19)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Format converter (PNG/JPEG/WebP/AVIF/JXL/QOI) | Convert between formats | jSquash codecs (Apache-2.0: avif, jpeg/MozJPEG, jxl, png, oxipng, qoi, webp, resize) (https://github.com/jamsinclair/jSquash); `OffscreenCanvas.convertToBlob` for basic PNG/JPEG/WebP | CAVEAT: AVIF encode is slow on large images, so use a worker. Canvas can't encode AVIF reliably in every browser | SQ, DT, CC, CB | P0 |
| Compressor (quality slider, before/after) | Lossy/lossless optimisation | jSquash MozJPEG/WebP/AVIF + oxipng; libimagequant (Squoosh `imagequant`, GPL-3.0, verify) for PNG palette reduction | CAVEAT: the imagequant licence is GPL, so check before bundling | SQ, DT | P1 |
| Resize | Resize with high-quality filters | jSquash resize (Apache-2.0) or pica (MIT) | OK | SQ, CC | P1 |
| Crop / rotate / flip | Basic transforms | Canvas (native) | OK | SQ (rotate), CC | P1 |
| Adjust / filters (brightness, contrast, blur, invert, grayscale, sharpen) | Image adjustments | Canvas 2D `filter` / own pixel ops | OK | CC | P2 |
| EXIF / metadata viewer | Show EXIF, IPTC, XMP, GPS | exifr (MIT) | OK | CC | P2 |
| EXIF / metadata stripper | Remove metadata | Lossless: drop APP1 segments (own code) or piexifjs (MIT, JPEG only). Lossy: canvas re-encode | CAVEAT: canvas re-encode recompresses and also drops the ICC profile | CC | P2 |
| SVG optimiser | SVGO with a plugin toggle UI | svgo browser bundle (MIT) | OK | none (SVGOMG is standalone) | P2 |
| SVG → PNG/JPG | Rasterise SVG at any size | `Image` + Canvas | CAVEAT: SVGs that reference external fonts or images won't load them | none | P2 |
| Raster → SVG (trace) | Vectorise a bitmap | imagetracerjs (Unlicense) | CAVEAT: quality is limited; potrace ports are GPL | none | P2 |
| Favicon / ICO generator | PNG → multi-size ICO plus apple-touch, manifest icons | Canvas + own ICO container writer (ICO embeds PNG) | OK | none | P2 |
| Image ↔ Base64 data URI | (Same as 1.3 "Base64 file/image") | — | — | IT, DT, CC, CB | P0 |
| HEIC/HEIF → JPEG/PNG | Convert iPhone photos | heic2any (MIT), which bundles libheif (LGPL-3.0) | CAVEAT: large WASM; Safari can decode HEIC natively | none | P2 |
| Image compare / diff | Side-by-side slider, pixel diff | pixelmatch (ISC) | OK | SQ (side-by-side) | P2 |
| Add text / watermark / pixelate region | Annotate or redact images | Canvas | OK | CC (Add Text), CB (Pixelate) | P1 |
| GIF maker / frame extractor | Images → GIF, GIF → frames | gifenc (MIT); `ImageDecoder` (WebCodecs) to decode | CAVEAT: `ImageDecoder` is not in all browsers | none | P2 |
| OCR (image → text) | Extract text | tesseract.js (Apache-2.0), 100+ languages | CAVEAT: language data is downloaded per language (v5 is "54% smaller for English" but still MBs). It is loaded from a CDN by default, so self-host it. Does not read PDFs | CC | P2 |
| Background removal | Remove the image background | @imgly/background-removal (AGPL-3.0) | CAVEAT: AGPL, plus a large ONNX model download | none | P2 |
| Screenshot beautifier / device mockup | Frame screenshots | Canvas | OK | none | P2 |

### 1.12 PDF (30)

All Stirling-PDF tools below run server-side in Stirling. The column shows how to do each one in the browser.

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Merge PDFs | Combine files | pdf-lib (MIT) `copyPages` | CAVEAT: upstream pdf-lib "does not currently support encrypted documents" and looks unmaintained. Prefer @cantoo/pdf-lib (MIT, maintained fork) | SP | P2 |
| Split / extract pages | By range, every N, or bookmarks | pdf-lib | OK | SP | P2 |
| Rotate pages | 90/180/270 | pdf-lib `setRotation` | OK | SP | P2 |
| Reorder / delete pages (page organiser) | Drag-and-drop thumbnails | pdf.js (Apache-2.0) thumbnails + pdf-lib | OK | SP | P2 |
| PDF → images (PNG/JPG) | Rasterise pages | pdf.js render to Canvas | OK. Memory grows with DPI × pages | SP, CC (Render PDF) | P1 |
| Images → PDF | JPG/PNG into a PDF | pdf-lib `embedJpg`/`embedPng` or jsPDF (MIT) | OK. WebP/AVIF need a decode to PNG/JPEG first | SP | P2 |
| Extract text | Text per page | pdf.js `getTextContent` | CAVEAT: scanned PDFs have no text layer, so they need OCR | SP | P2 |
| Extract images | Pull embedded images | pdf.js operator list, or mupdf.js (AGPL-3.0) | CAVEAT: decoding JPX/JBIG2 streams is incomplete with pdf.js-only approaches | SP | P2 |
| Compress | Reduce size | Lossless: object-stream and garbage collection via mupdf.js (AGPL-3.0). Lossy: re-encode images, or rasterise via pdf.js + jsPDF | CAVEAT: there is no permissive, maintained, image-downsampling PDF compressor. pdf-lib can't recompress images. mupdf.js is AGPL (commercial licence available). Rasterising destroys text | SP | P2 |
| Password protect | Encrypt with AES-256 | @cantoo/pdf-lib (MIT) `encrypt()` (AES-256 default; https://github.com/cantoo-scribe/pdf-lib) | OK | SP | P2 |
| Unlock (with known password) / remove permissions | Decrypt and save | @cantoo/pdf-lib or pdf.js (open with password) + re-save | OK. Cracking unknown passwords is out of scope | SP | P2 |
| Sign (visual: draw/type/upload signature) | Place a signature image | pdf-lib + Canvas signature pad | OK | SP | P2 |
| Digital signature (certificate, PAdES) | Cryptographic signing with .p12 | @signpdf/signpdf (MIT) + node-forge (BSD-3-Clause) | CAVEAT: browser support of @signpdf is unverified, and timestamping (TSA) needs a network call (NO) | SP | P2 |
| Validate signature | Check embedded signatures | pdf.js to get bytes + pkijs (BSD-3-Clause) CMS verify | CAVEAT: revocation (OCSP/CRL) checks need network (NO) | SP, IT (PDF signature checker) | P1 |
| Annotate / add text / add image | Overlay content | pdf-lib; pdf.js annotation editor | OK | SP | P2 |
| Watermark / stamp | Text or image watermark | pdf-lib | OK | SP | P2 |
| Page numbers | Add numbering | pdf-lib | OK | SP | P2 |
| Edit metadata | Title, author, keywords, dates | pdf-lib `setTitle` etc. | OK. XMP metadata needs extra handling | SP | P2 |
| Fill forms / flatten | AcroForm fill and flatten | pdf-lib forms API | OK. XFA forms are not supported | SP | P2 |
| Redact (true removal) | Remove text and images under a region | mupdf.js (AGPL-3.0) redaction API | CAVEAT: drawing a black box with pdf-lib does **not** remove the underlying text. Real redaction needs MuPDF (AGPL) | SP | P2 |
| OCR → searchable PDF | Add a text layer to scans | tesseract.js + pdf-lib invisible text layer | CAVEAT: slow (seconds per page), plus a model download; tesseract.js itself "does not support PDF files" | SP | P2 |
| Compare PDFs | Text diff between versions | pdf.js text + jsdiff | OK (text-level only) | SP | P2 |
| PDF info / inspector | Pages, fonts, metadata, encryption, JS | pdf.js | OK | SP | P2 |
| Remove blank pages | Detect near-empty pages | pdf.js render + pixel threshold | OK | SP | P2 |
| N-up / booklet / single-large-page | Imposition layouts | pdf-lib `embedPage` | OK | SP | P2 |
| Crop / resize pages | Change the crop and media box | pdf-lib | OK | SP | P2 |
| Attachments manage | Add or extract embedded files | pdf-lib `attach`; pdf.js attachments | OK | SP | P2 |
| Edit bookmarks / TOC | Outline editing | low-level pdf-lib object editing | CAVEAT: no high-level API; custom code | SP | P2 |
| Repair damaged PDF | Rebuild xref | mupdf.js (AGPL-3.0) | CAVEAT: AGPL | SP | P2 |
| PDF ↔ Office (Word/Excel/PPT) | High-fidelity conversion | none permissive | **NO** in practice: Stirling uses LibreOffice server-side. Low-fidelity PDF→text/HTML is possible via pdf.js | SP | — |

### 1.13 Office and document conversion (8)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| CSV ↔ XLSX | Convert spreadsheets | SheetJS CE (Apache-2.0; https://docs.sheetjs.com/docs/miscellany/license) or ExcelJS (MIT) | CAVEAT: SheetJS publishes current versions on its own CDN, not npm (verify install docs) | CB (Excel converters) | P2 |
| XLSX viewer / → JSON / → HTML | Inspect sheets | SheetJS CE | OK | CB | P2 |
| DOCX → HTML / Markdown | Convert Word docs | mammoth (BSD-2-Clause), with turndown for Markdown | OK. Mammoth targets semantic HTML, not pixel fidelity | CB (Word converters) | P2 |
| Markdown → DOCX | Export Word | docx (MIT) | OK | none | P2 |
| Universal converter (pandoc) | MD/RST/LaTeX/DOCX/EPUB/HTML/ODT | pandoc.wasm (GPL-2.0-or-later); the official demo says "Nothing is being transmitted to the server" (https://pandoc.org/app/) | CAVEAT: large WASM download; GPL | none | P2 |
| Markdown / HTML → PDF | Print-quality PDF | `window.print()` with print CSS (native) | OK. Output depends on the browser's print engine | none | P2 |
| Parquet / Avro viewer | Inspect columnar files | hyparquet (MIT); avsc (MIT) | OK | CC (Avro to JSON) | P2 |
| SQLite database browser | Open .sqlite, run queries | sql.js (MIT) | OK. The whole DB is loaded into memory | none | P2 |

### 1.14 Audio and video (9)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Video format convert (MP4/WebM/MKV/MOV) | Transcode | Mediabunny (MPL-2.0, on WebCodecs, hardware-accelerated; https://github.com/Vanilagy/mediabunny) or ffmpeg.wasm | CAVEAT: see the ffmpeg.wasm notes below this table | none | P2 |
| Trim / cut video or audio | Cut a time range | Mediabunny (remux without re-encode) / ffmpeg.wasm | CAVEAT: as above | none | P2 |
| Extract audio from video | Demux the audio track | Mediabunny / ffmpeg.wasm | OK | none | P2 |
| Video → GIF | Make GIFs | ffmpeg.wasm or WebCodecs + gifenc | CAVEAT: memory | none | P2 |
| Compress video | Lower bitrate or resolution | Mediabunny/WebCodecs or ffmpeg.wasm | CAVEAT: slow in WASM single-thread | none | P2 |
| Audio convert / trim (WAV/MP3/OGG/FLAC) | Convert audio | Web Audio `decodeAudioData` + encoders; ffmpeg.wasm | CAVEAT: MP3 encode via lamejs (LGPL) or ffmpeg | none | P2 |
| Media info | Codec, bitrate, duration, tracks, ID3 | Mediabunny; mediainfo.js (BSD-2-Clause, verify) | OK | CC (Extract ID3 / audio metadata) | P2 |
| Screen recorder | Record a screen or tab to WebM/MP4 | `getDisplayMedia` + `MediaRecorder` (native) | OK. Not available on mobile | none | P2 |
| Camera recorder / photo | Record from webcam | `getUserMedia` + `MediaRecorder` | OK | IT | P2 |

ffmpeg.wasm notes, from the official FAQ (https://ffmpegwasm.netlify.app/docs/faq):
- `@ffmpeg/ffmpeg` is MIT. `@ffmpeg/core` follows "the same licenses as FFmpeg and its external libraries" (LGPL, or GPL if built with x264 etc.).
- Input is limited to 2 GB, "a hard limit in WebAssembly".
- The multi-thread core is about 2x faster "but consume a lot more memory and cpu".
- The multi-thread core (`@ffmpeg/core-mt`) needs `SharedArrayBuffer`, so the page must be cross-origin isolated (COOP + COEP). The single-thread core does not.

### 1.15 Archives and compression (7)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| Gzip / gunzip a file | .gz compress and decompress | `CompressionStream('gzip')` (native) or fflate (MIT) | OK | DT (GZIP), CC | P1 |
| Zip create / extract | Make or open .zip | fflate (MIT), streaming | OK. ZIP64 is needed for >4 GB. Encrypted zips need zip.js (BSD-3-Clause) | CC | P2 |
| Tar / untar (+ .tar.gz) | Tar archives | nanotar (MIT, verify) or own (simple format) | OK | CC | P2 |
| 7z / RAR / bzip2 / xz extract | Open other archives | libarchive.js (MIT; reads ZIP, 7-Zip, RAR v4/v5, TAR; https://github.com/nika-begiashvili/libarchivejs) | CAVEAT: WASM download; RAR is read-only | none | P2 |
| Archive browser | List contents, extract single files | fflate / libarchive.js | OK | none | P2 |
| LZ4 / LZMA / zstd / brotli (de)compress | Other codecs | Small WASM libs per codec | CAVEAT: not native (Compression Streams has only gzip/deflate) | CC | P2 |
| Zip → download-folder (save extracted tree) | Write the extracted folder to disk | File System Access `showDirectoryPicker` | CAVEAT: Chromium-only; elsewhere, re-zip or download individually | none | P2 |

### 1.16 Forensics, binary and platform features (8)

| Tool | Description | Client-side approach/library (licence) | Caveats | Seen in | Tier |
|---|---|---|---|---|---|
| File-type detector (magic bytes) | Identify a file from its header | file-type (MIT) browser entry | OK | CC | P2 |
| Hex viewer / editor | Inspect file bytes | own virtualised view over `Blob.slice` | OK, scales to GB with slicing | CC (Hexdump) | P2 |
| Strings extractor | Printable strings from a binary | own code | OK | CC | P2 |
| Entropy / byte histogram | Analyse randomness | own code | OK | CC | P2 |
| Auto-detect encoding ("Magic") | Guess and decode layered encodings | own heuristics (CyberChef's Magic is the reference) | OK, heuristic | CC | P2 |
| Pipeline / recipe chaining | Chain tools (Base64 → gunzip → JSON format) | platform feature | OK | CC (Flow control), SP (Automate) | P1 |
| Benchmark builder | Compare JS snippet timings | `performance.now()` in a worker | CAVEAT: timer precision is coarsened unless cross-origin isolated | IT | P2 |
| Shareable state via URL fragment | Share input in `#...` (never sent to the server) | URL fragment (native) | CAVEAT: the fragment is not sent in HTTP requests, but it does sit in browser history. Default to off for secrets | none | P2 |

**Count:** 1.1 JSON 17 · 1.2 YAML/TOML/XML/INI/CSV 21 · 1.3 Encoders 24 · 1.4 Hash/crypto 25 · 1.5 Text 22 · 1.6 Time 9 · 1.7 Web 23 (9 of them NO) · 1.8 Network calc 7 · 1.9 Code 27 · 1.10 Numbers/colour/misc 24 · 1.11 Images 19 · 1.12 PDF 30 (1 NO) · 1.13 Office/docs 8 · 1.14 Audio/video 9 · 1.15 Archives 7 · 1.16 Forensics/platform 8. **Total 280 rows, 10 marked NO.**

---

## 2. Not feasible client-side (or breaks the promise)

| Item | Why |
|---|---|
| Remote URL fetch tools: header/CORS checker, HTTP client, WebSocket tester, sitemap/link checker, URL→PDF, website screenshot | Same-origin policy and CORS block reading most cross-origin responses. Any request to a third party also violates `connect-src 'self'`. |
| DNS lookup, WHOIS/RDAP | Needs a third-party resolver or registry, so the queried data leaves the device. |
| Remote SSL/TLS checker, port scan, ping, "what's my IP" | Browsers expose no raw sockets or TLS internals. Public IP needs a server echo. |
| JWKS-URL JWT verify, OCSP/CRL revocation, TSA timestamping for PDF signing, remote `$ref`/`@context` resolution | Each needs a network fetch. Accept pasted material only. |
| PDF ↔ Office high-fidelity conversion | No permissive client-side engine. Stirling-PDF uses LibreOffice on its server. |
| Native XSLT in Chrome | Removed from Chrome Stable in Chrome 158 (Nov 2026). |

Feasible with limits: bcrypt/Argon2 at high cost, OCR model size, ffmpeg.wasm (2 GB cap, COOP/COEP for multi-thread), true PDF redaction and compression (AGPL MuPDF only), AVIF encode speed, DuckDB/pandoc/TypeScript bundle size, Chromium-only APIs (`EyeDropper`, `showDirectoryPicker`/`showSaveFilePicker`, `BarcodeDetector`).

---

## 3. Primary-source facts for "no data leaves the browser"

**Cross-origin isolation (COOP/COEP).**
- Requirements: send `Cross-Origin-Opener-Policy: same-origin` plus `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`). The `cross-origin-isolated` Permissions-Policy must not be blocked; its default allowlist is `self`.
- What it unlocks: `SharedArrayBuffer` (needed by ffmpeg.wasm multi-thread and other threaded WASM), more precise `performance.now()`, and `performance.measureUserAgentSpecificMemory()`.
- Check `window.crossOriginIsolated` at runtime.
- With `require-corp`, cross-origin subresources need `Cross-Origin-Resource-Policy` or CORS. Self-hosting all assets avoids that.
- Sources: https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated , https://html.spec.whatwg.org/multipage/browsers.html#cross-origin-opener-policies , https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
- Hosting: pick a static host that can set response headers. A service-worker shim (coi-serviceworker) is the workaround on hosts that can't.

**CSP as an enforceable egress guarantee.**
- `connect-src` governs `fetch()`, `fetchLater()`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon()` and `<a ping>`, and falls back to `default-src` (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src).
- CSP Level 3 also defines a `webrtc` directive whose values are `'allow'` and `'block'`. It blocks ICE candidates, which `connect-src` doesn't cover (https://www.w3.org/TR/CSP3/ §6.2.1). Check browser support before relying on it.
- Proposed baseline: `default-src 'self'; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; worker-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; webrtc 'block'`.
- Gaps:
  - Top-level navigation is not covered by any CSP3 directive (`navigate-to` is not in CSP3), so a script could still navigate away with data in the URL. Mitigate with code review and no third-party scripts.
  - Every library, WASM file, font, OCR model and ML model must be self-hosted. tesseract.js and some WASM libs default to CDNs.
  - Analytics would break the promise (compare Squoosh, which reports image sizes to Google Analytics).
  - CSP3 itself says it "is not intended as a first line of defense against content injection vulnerabilities".
- Publishing the CSP header and letting users verify it in DevTools is a checkable form of the promise.

**Service worker / offline PWA.**
- Service workers run only in secure contexts. They can precache the whole app (Cache API) so it works offline. Offline use is also a demonstrable privacy property (https://w3c.github.io/ServiceWorker/ , https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
- Large optional assets (ffmpeg core, OCR models, DuckDB) should be cached on first use, not in the precache.

**On-device storage.**
- `localStorage`, `sessionStorage`, IndexedDB, Cache API and OPFS are all origin-partitioned stores on the user's device, subject to browser quota and eviction. `navigator.storage.estimate()` and `navigator.storage.persist()` manage them (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- OPFS is "private to the origin of the page and not visible to the user like the regular file system". Its synchronous access handles work in workers, which makes it suitable as scratch space for multi-GB processing. "Clearing storage data for the site deletes the OPFS" (https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system).
- None of these stores sync to a server by themselves. Browser profile backup or sync is outside the app's control; say so in the privacy page.
- File System Access pickers (`showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker`) are Chromium-only. Fall back to `<input type=file>` and `<a download>`.

**Web Crypto.**
- `SubtleCrypto` is "available only in secure contexts (HTTPS)" and also in workers.
- Algorithms:
  - Sign/verify: RSASSA-PKCS1-v1_5, RSA-PSS, ECDSA, Ed25519, HMAC.
  - Encrypt/decrypt: RSA-OAEP, AES-CTR/CBC/GCM.
  - Digest: SHA-1/256/384/512 only, so no MD5 or SHA-3.
  - Derive: ECDH, X25519, HKDF, PBKDF2.
- Source: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
- `crypto.randomUUID()` is also secure-context only. `crypto.getRandomValues()` is a CSPRNG and is the right source for every generator.
- Implication: serve over HTTPS only; `localhost` counts as secure for development.

---

## 4. Tier summary (mechanical, from "Seen in" counts)

- **P0 (3+ projects), 36 tools:**
  - JSON: format, validate, minify, ↔CSV
  - Formats: JSON↔YAML, XML format, XML↔JSON
  - Encoders: Base64 text, Base64 file, URL, HTML entities, JWT decode, string escape, text↔binary
  - Crypto: hash text, UUID, password generator, text encrypt/decrypt
  - Text: diff, regex tester, case converter, lorem ipsum, text stats, line tools
  - Time: Unix timestamp
  - Network: IPv4 subnet, IP format converter
  - Code: SQL formatter, Markdown preview, Markdown→HTML
  - Numbers/colour: number base, unit converter, colour converter, QR generator
  - Images: format converter, image↔Base64
- **P1 (2 projects), 49 tools.** Includes YAML lint/format, TOML conversions, JSONPath, JSON diff, HMAC, bcrypt, ULID, TOTP, X.509 decode, cron parser, URL parser, UA parser, JS/CSS formatters and minifiers, chmod, bitwise, QR decode, image compress/resize/crop, PDF→images, PDF signature validation, gzip, recipe chaining.
- **P2:** 185 tools. The remaining 10 rows are marked NO and have no tier.

## 5. Suggested judgment overrides (for your review)

These go against the mechanical count. The reason is noted for each.
- **PDF core to P0:** merge, split, rotate/reorder, images→PDF, password protect/unlock, compress. They count low only because one surveyed project (SP) covers PDFs. PDF is a separate tool family with high demand, and pdf-lib/pdf.js make it cheap. Compress stays CAVEAT because of licensing.
- **Image compress and resize to P0:** Squoosh's whole product is these two.
- **cURL→code, JSON→TS types, JSON Schema validate, HTML formatter, timezone converter, semver, .env parser, .gitignore generator to P1:** common developer needs that the surveyed apps happen to lack.
- **CyberChef long tail to stay P2 or drop:** classical ciphers, Enigma/Bombe, Braille, leetspeak, novelty encodings.
- **Treat AGPL dependencies (mupdf.js redaction/compress/repair, @imgly background removal, ua-parser-js v2) as a licensing decision before building.** AGPL applies when you distribute the code, which a served web app does.

## 6. Library index (licence + primary URL)

| Library | Licence | URL |
|---|---|---|
| jsonc-parser | MIT | https://github.com/microsoft/node-jsonc-parser |
| PapaParse | MIT | https://github.com/mholt/PapaParse |
| jsondiffpatch | MIT | https://github.com/benjamine/jsondiffpatch |
| jsonpath-plus | MIT | https://github.com/JSONPath-Plus/JSONPath |
| jq | MIT | https://github.com/jqlang/jq |
| jsonata | MIT | https://github.com/jsonata-js/jsonata |
| Ajv | MIT | https://github.com/ajv-validator/ajv |
| quicktype | Apache-2.0 | https://github.com/glideapps/quicktype |
| json-schema-to-typescript | MIT | https://github.com/bcherny/json-schema-to-typescript |
| jsonrepair | ISC (verify) | https://github.com/josdejong/jsonrepair |
| @msgpack/msgpack | ISC | https://github.com/msgpack/msgpack-javascript |
| cbor-x | MIT | https://github.com/kriszyp/cbor-x |
| bson | Apache-2.0 | https://github.com/mongodb/js-bson |
| jsonld.js | BSD-3-Clause | https://github.com/digitalbazaar/jsonld.js |
| yaml | ISC | https://github.com/eemeli/yaml |
| js-yaml | MIT | https://github.com/nodeca/js-yaml |
| smol-toml | BSD-3-Clause | https://github.com/squirrelchat/smol-toml |
| fast-xml-parser | MIT | https://github.com/NaturalIntelligence/fast-xml-parser |
| xml-formatter | MIT | https://github.com/chrisbottin/xml-formatter |
| xmllint-wasm | MIT (verify) | https://github.com/noppa/xmllint-wasm |
| ini | ISC | https://github.com/npm/ini |
| DuckDB-WASM | MIT | https://github.com/duckdb/duckdb-wasm |
| sql.js | MIT | https://github.com/sql-js/sql.js |
| he | MIT | https://github.com/mathiasbynens/he |
| punycode.js | MIT | https://github.com/mathiasbynens/punycode.js |
| jose | MIT | https://github.com/panva/jose |
| @scure/base, @scure/bip39 | MIT | https://github.com/paulmillr/scure-base |
| iconv-lite | MIT | https://github.com/ashtuchkin/iconv-lite |
| protobufjs | BSD-3-Clause | https://github.com/protobufjs/protobuf.js |
| asn1js, pkijs | BSD-3-Clause | https://github.com/PeculiarVentures/PKI.js |
| @peculiar/x509 | MIT | https://github.com/PeculiarVentures/x509 |
| hash-wasm | MIT (verify) | https://github.com/Daninet/hash-wasm |
| bcryptjs | BSD-3-Clause (verify) | https://github.com/dcodeIO/bcrypt.js |
| uuid | MIT | https://github.com/uuidjs/uuid |
| ulid | MIT | https://github.com/ulid/javascript |
| nanoid | MIT | https://github.com/ai/nanoid |
| @zxcvbn-ts/core | MIT | https://github.com/zxcvbn-ts/zxcvbn |
| @noble/curves, @noble/hashes | MIT | https://github.com/paulmillr/noble-curves |
| crypto-js (discontinued) | MIT | https://github.com/brix/crypto-js |
| openpgp.js | LGPL-3.0-or-later | https://github.com/openpgpjs/openpgpjs |
| otpauth | MIT | https://github.com/hectorm/otpauth |
| bip39 | ISC | https://github.com/bitcoinjs/bip39 |
| Monaco Editor | MIT | https://github.com/microsoft/monaco-editor |
| jsdiff | BSD-3-Clause | https://github.com/kpdecker/jsdiff |
| diff-match-patch | Apache-2.0 | https://github.com/google/diff-match-patch |
| change-case | MIT | https://github.com/blakeembrey/change-case |
| @sindresorhus/slugify | MIT | https://github.com/sindresorhus/slugify |
| figlet | MIT | https://github.com/patorjk/figlet.js |
| emojibase | MIT | https://github.com/milesj/emojibase |
| ansi_up | MIT | https://github.com/drudru/ansi_up |
| @faker-js/faker | MIT | https://github.com/faker-js/faker |
| @js-temporal/polyfill | ISC | https://github.com/js-temporal/temporal-polyfill |
| date-fns | MIT | https://github.com/date-fns/date-fns |
| cronstrue | MIT | https://github.com/bradymholt/cRonstrue |
| croner | MIT | https://github.com/Hexagon/croner |
| bowser | MIT | https://github.com/bowser-js/bowser |
| ua-parser-js | v1 MIT / v2 AGPL-3.0 | https://github.com/faisalman/ua-parser-js |
| statuses | MIT | https://github.com/jshttp/statuses |
| mime-db | MIT | https://github.com/jshttp/mime-db |
| curlconverter | MIT | https://github.com/curlconverter/curlconverter |
| swagger-ui | Apache-2.0 | https://github.com/swagger-api/swagger-ui |
| Redoc | MIT | https://github.com/Redocly/redoc |
| @apidevtools/swagger-parser | MIT | https://github.com/APIDevTools/swagger-parser |
| TipTap | MIT | https://github.com/ueberdosis/tiptap |
| ipaddr.js | MIT | https://github.com/whitequark/ipaddr.js |
| ip-address | MIT | https://github.com/beaugunderson/ip-address |
| sql-formatter | MIT | https://github.com/sql-formatter-org/sql-formatter |
| Prettier (standalone) | MIT | https://prettier.io/docs/browser |
| Terser | BSD-2-Clause | https://github.com/terser/terser |
| esbuild-wasm | MIT | https://github.com/evanw/esbuild |
| lightningcss | MPL-2.0 | https://github.com/parcel-bundler/lightningcss |
| csso | MIT | https://github.com/css/csso |
| html-minifier-terser | MIT | https://github.com/terser/html-minifier-terser |
| graphql-js | MIT | https://github.com/graphql/graphql-js |
| marked | MIT | https://github.com/markedjs/marked |
| markdown-it | MIT | https://github.com/markdown-it/markdown-it |
| DOMPurify | MPL-2.0 OR Apache-2.0 | https://github.com/cure53/DOMPurify |
| turndown | MIT | https://github.com/mixmark-io/turndown |
| mermaid | MIT | https://github.com/mermaid-js/mermaid |
| Shiki | MIT | https://github.com/shikijs/shiki |
| html-to-image | MIT | https://github.com/bubkoo/html-to-image |
| @svgr/core | MIT | https://github.com/gregberge/svgr |
| postcss | MIT | https://github.com/postcss/postcss |
| TypeScript | Apache-2.0 | https://github.com/microsoft/TypeScript |
| @graphql-codegen | MIT | https://github.com/dotansimha/graphql-code-generator |
| composerize | MIT | https://github.com/composerize/composerize |
| dockerfile-utils | MIT | https://github.com/rcjsuen/dockerfile-utils |
| hadolint (reference only) | GPL-3.0 | https://github.com/hadolint/hadolint |
| kubernetes-json-schema | Apache-2.0 | https://github.com/yannh/kubernetes-json-schema |
| dotenv | BSD-2-Clause | https://github.com/motdotla/dotenv |
| github/gitignore | CC0-1.0 | https://github.com/github/gitignore |
| mathjs | Apache-2.0 | https://github.com/josdejong/mathjs |
| semver | ISC | https://github.com/npm/node-semver |
| culori | MIT | https://github.com/Evercoder/culori |
| qrcode | MIT | https://github.com/soldair/node-qrcode |
| jsQR | Apache-2.0 | https://github.com/cozmo/jsQR |
| zxing-wasm | MIT | https://github.com/Sec-ant/zxing-wasm |
| bwip-js | MIT | https://github.com/metafloor/bwip-js |
| JsBarcode | MIT | https://github.com/lindell/JsBarcode |
| libphonenumber-js | MIT | https://github.com/catamphetamine/libphonenumber-js |
| ibantools | MPL-2.0 | https://github.com/Simplify/ibantools |
| jSquash (Squoosh codecs) | Apache-2.0 | https://github.com/jamsinclair/jSquash |
| Squoosh | Apache-2.0 | https://github.com/GoogleChromeLabs/squoosh |
| pica | MIT | https://github.com/nodeca/pica |
| exifr | MIT | https://github.com/MikeKovarik/exifr |
| piexifjs | MIT | https://github.com/hMatoba/piexifjs |
| SVGO | MIT | https://github.com/svg/svgo |
| imagetracerjs | Unlicense | https://github.com/jankovicsandras/imagetracerjs |
| heic2any (libheif) | MIT (libheif LGPL-3.0) | https://github.com/alexcorvi/heic2any |
| pixelmatch | ISC | https://github.com/mapbox/pixelmatch |
| gifenc | MIT | https://github.com/mattdesl/gifenc |
| tesseract.js | Apache-2.0 | https://github.com/naptha/tesseract.js |
| @imgly/background-removal | AGPL-3.0 | https://github.com/imgly/background-removal-js |
| pdf.js | Apache-2.0 | https://github.com/mozilla/pdf.js |
| pdf-lib | MIT | https://github.com/Hopding/pdf-lib |
| @cantoo/pdf-lib | MIT | https://github.com/cantoo-scribe/pdf-lib |
| mupdf.js | AGPL-3.0 (commercial available) | https://github.com/ArtifexSoftware/mupdf.js |
| jsPDF | MIT | https://github.com/parallax/jsPDF |
| @signpdf/signpdf | MIT | https://github.com/vbuch/node-signpdf |
| node-forge | BSD-3-Clause OR GPL-2.0 | https://github.com/digitalbazaar/forge |
| SheetJS CE | Apache-2.0 | https://docs.sheetjs.com/docs/miscellany/license |
| ExcelJS | MIT | https://github.com/exceljs/exceljs |
| mammoth | BSD-2-Clause | https://github.com/mwilliamson/mammoth.js |
| docx | MIT | https://github.com/dolanmiu/docx |
| pandoc (wasm) | GPL-2.0-or-later | https://github.com/jgm/pandoc , https://pandoc.org/app/ |
| hyparquet | MIT | https://github.com/hyparam/hyparquet |
| avsc | MIT | https://github.com/mtth/avsc |
| ffmpeg.wasm | MIT wrapper; core per FFmpeg (LGPL/GPL) | https://github.com/ffmpegwasm/ffmpeg.wasm , https://ffmpegwasm.netlify.app/docs/faq |
| Mediabunny | MPL-2.0 | https://github.com/Vanilagy/mediabunny |
| lamejs | LGPL-3.0 | https://github.com/zhuker/lamejs |
| mediainfo.js | BSD-2-Clause (verify) | https://github.com/buzz/mediainfo.js |
| fflate | MIT | https://github.com/101arrowz/fflate |
| zip.js | BSD-3-Clause | https://github.com/gildas-lormeau/zip.js |
| libarchive.js | MIT | https://github.com/nika-begiashvili/libarchivejs |
| file-type | MIT | https://github.com/sindresorhus/file-type |

Licences confirmed by reading the repo or docs during this research: ua-parser-js, SheetJS CE, jSquash, Squoosh, @cantoo/pdf-lib, pdf-lib, mupdf.js, tesseract.js, @imgly/background-removal, curlconverter, libarchive.js, DuckDB-WASM, Mediabunny, ffmpeg.wasm, transform.tools. The rest are from known repo metadata. Re-check each before adding it as a dependency, especially the "(verify)" rows.
