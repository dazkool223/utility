# Writing a Tool

Every Tool follows the same structure so the catalog, search, Smart Paste, Extension and tests pick it up automatically. Read [CONTEXT.md](../CONTEXT.md) for vocabulary and [spec.md](spec.md) §3–§5 for the quality bar.

Reference implementations to copy:
- `packages/tools/src/tools/json/format/`: text → text with options (`TextTransform`)
- `packages/tools/src/tools/encoders/base64/`: two-way converter (`TextTransform` with two modes)
- `packages/tools/src/tools/crypto/uuid/`: generator (`GeneratorTool`)

## Layout

```
packages/tools/src/tools/<category>/<slug>/
  meta.ts          # default-exports defineTool({...}); discovered automatically, no registry edits
  logic.ts         # pure functions, no React, no DOM where avoidable
  logic.test.ts    # golden tests (vitest)
  Tool.tsx         # default-exports the React component; receives ToolProps
  worker.ts        # optional: Comlink-exposed heavy work (see "Performance")
```

`<category>` must be a `CategoryId` from `src/core/types.ts`. `path` in meta is `<category>/<slug>` and must match the folder.

## meta.ts rules

- `id`: kebab-case, globally unique. `path`: `<category>/<slug>`.
- `name`: Title Case, short ("JWT Decoder"). `description`: one plain sentence.
- `priority`: from spec §10.
- `aliases`: what people actually type ("b64", "epoch", "prettify", "sha256").
- `related`: ids of **existing** Tools only (a unit test fails otherwise). Add links in both directions when you build the second Tool.
- `inputKind`: `'text' | 'image' | 'pdf' | 'media' | 'binary' | 'none'`. Decides the Supported Size.
- `accepts`: Smart Paste kinds (`DetectKind` in `src/core/detect.ts`) the Tool handles directly. If you need a new kind, add it to `detect.ts` and a test case in `core.test.ts`.
- `example`: **required for every Tool with `inputKind: 'text'`**, and recommended for generators (`input: ''`). `expect` is a substring of the output that the generic E2E test checks in Chromium, Firefox and WebKit.
- `restrictions`: any known limit, as a plain sentence (spec "⚠" rows). Use `applies: () => boolean` for browser-feature checks, e.g. `applies: () => !('EyeDropper' in window)`.
- `heavy: true` if the engine is over about 2 MB (WASM, models). Heavy Tools aren't in the Extension.
- `quickLauncher` / `contextMenu`: only for instant text Tools listed in spec §6.
- `load: () => import('./Tool')`.
- `steps` (text Tools): the operations this Tool contributes to the Pipeline Tool, loaded lazily:
  `steps: () => import('./logic').then((m) => [{ id: 'json-format:pretty', label: 'JSON: format (2 spaces)', run: (s) => m.formatJson(s, …) }])`.
  Step ids are `<tool-id>:<variant>` and must be unique. Labels read "Area: action".

## UI rules

- Import shared UI from `@/ui` and core from `@/core/...`. shadcn primitives live in `@/ui/shadcn/*`. Style with Tailwind classes and the theme tokens (`bg-card`, `text-muted-foreground`, `border`, …). **Don't hard-code colours.**
- Text → text: use `TextTransform` (`modes`, `options`, `initialInput`). `run` throws `ToolError('plain-language message')` on bad input. Never return a silently wrong result.
- Generators: `GeneratorTool`.
- Decoders and inspectors (JWT, certificate, URL parser…): a `CodeEditor` input plus `KeyValueTable` output (it carries `data-testid="tool-output"`), or a `TextTransform` that prints readable text or JSON.
- Files: `FileDrop` (handles the Supported Size Restriction and "Continue anyway"), `FileList`, `DownloadButton` / `downloadBlob`. Accept `initialFiles` from `ToolProps` (Smart Paste hands dropped files over).
- Give the primary output element `data-testid="tool-output"`, and errors go through `ErrorBox` (`data-testid="tool-error"`). The shared components already do this.
- Options go in `OptionsBar` using `Select`, `Checkbox`, `NumberInput`, `TextInput`, `Segmented`.
- Keyboard: `TextTransform` and `GeneratorTool` already wire Run (Ctrl/⌘ Enter) and Copy output (Alt Shift C). Custom layouts: call `useRunShortcut(fn)` and render `<CopyButton primary text=… />`.
- Accessibility: every input has a label, and buttons have text or `aria-label`.

## Privacy rules (enforced by the E2E network guard; see ADR 0001)

- **No network.** No `fetch` to other origins, no CDN URLs, and no remote fonts, models, schemas or `$ref`s. Libraries that default to a CDN (tesseract.js, ffmpeg.wasm, pdf.js worker, etc.) must be pointed at files we serve: put large assets under `apps/web/public/engines/<tool>/` or import them with Vite `?url`.
- Never write Tool Input or Tool Output to localStorage, IndexedDB or the URL.
- Use `crypto.getRandomValues` / `crypto.randomUUID` for anything random. Never use `Math.random` for secrets, and use rejection sampling to avoid modulo bias.

## Performance rules (spec §4)

- A Tool chunk should stay **under 100 KB gzipped**. Bigger libraries load on demand (`await import('lib')` inside `run`) or go in a worker.
- Anything that can take more than about 50 ms on realistic input (hashing files, bcrypt, PDF, images, big parsing) runs in a Web Worker:

  ```ts
  // worker.ts
  import { expose } from 'comlink';
  export const api = { async compress(buf: ArrayBuffer, q: number) { /* … */ } };
  expose(api);

  // Tool.tsx
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const out = await api().compress(buf, 80);
  ```
- Stream large files (`file.stream()`, `Blob.slice`) instead of loading them whole when the library allows it.

## Libraries

Prefer the library named in `docs/research/tool-catalog.md` for that Tool. Install it in `packages/tools` (`pnpm --filter @utility/tools add <pkg>`). Don't hand-roll parsers or crypto that a maintained library already handles. Before adding a dependency, check its licence. If it is GPL, AGPL or otherwise copyleft and spec §8 doesn't already cover it, **stop and report it** instead of adding it.

## Done means

1. `pnpm --filter @utility/tools test` passes. `logic.test.ts` covers normal cases, edge cases (empty input, unicode, large input) and malformed input.
2. `pnpm --filter @utility/tools typecheck` and `pnpm --filter web typecheck` pass.
3. The Tool has an `example` (text Tools) or its own E2E spec in `apps/web/e2e/` (file Tools: use `page.setInputFiles` on `[data-testid=file-input]` with a small fixture in `apps/web/e2e/fixtures/`).
4. `pnpm --filter web exec playwright test` passes in all three browsers (or the Tool declares a `restrictions` entry with `applies` for the browser that lacks a feature, and its test skips that browser with a reason).
