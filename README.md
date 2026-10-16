# Utility

Developer tools that run entirely in your browser: JSON, YAML, Base64, JWT, hashes, PDFs, images and more. Nothing you enter leaves your device. The Content-Security-Policy blocks every outgoing connection after the app loads ([ADR 0001](docs/adr/0001-zero-network-after-load.md)).

Two Surfaces share one codebase ([ADR 0002](docs/adr/0002-monorepo-shared-tools-package.md)):

| Path | What |
|---|---|
| `packages/tools` | Every Tool (logic, tests, UI), the shared UI kit (shadcn/ui + Tailwind), search, Smart Paste, Preferences |
| `apps/web` | The Website (Vite, PWA, deployed to Vercel) |
| `apps/extension` | The browser Extension (Chrome + Firefox, Manifest V3) |

## Develop

```sh
pnpm install
pnpm dev                                   # Website at http://localhost:5173
pnpm --filter @utility/tools test          # unit + golden tests
pnpm -r typecheck
pnpm --filter web e2e                      # builds, serves with production headers, runs Chromium/Firefox/WebKit
pnpm --filter web exec vite build && pnpm --filter web budgets   # performance budgets (spec §4)
pnpm --filter extension build              # → apps/extension/dist/chrome and dist/firefox
pnpm --filter extension e2e                # loads the real extension in Chromium
```

Load the Extension unpacked:
- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `apps/extension/dist/chrome`.
- **Firefox:** `about:debugging` → This Firefox → Load Temporary Add-on → `apps/extension/dist/firefox/manifest.json`.

Set `VITE_WEBSITE_URL` when building the Extension so Heavy Tools link to the right Website.

## Adding a Tool

Read [docs/TOOL-AUTHORING.md](docs/TOOL-AUTHORING.md). In short: add `packages/tools/src/tools/<category>/<slug>/` with `meta.ts`, `logic.ts`, `logic.test.ts` and `Tool.tsx`. It's discovered automatically.

## Docs

- [docs/spec.md](docs/spec.md): approved product spec and Tool list
- [CONTEXT.md](CONTEXT.md): glossary
- [docs/research/tool-catalog.md](docs/research/tool-catalog.md): per-Tool library research with sources
- [docs/adr/](docs/adr/): architecture decisions
