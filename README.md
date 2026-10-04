# Pioneer Wiki · 先锋维基

A wiki. 一个维基。

| Part | Route | Manner |
|---|---|---|
| I 博物 Wiki | `/` | natural history — phyla, specimens, relation map |
| II 友链 Links | `/links` | geography — an atlas gazetteer |
| III 成员 Members | `/members`, `/members/[handle]` | fine art — cast list, personal pages with bookplates |
| IV 交流 Forum | `/forum` | engineering blueprint — a drawing register |

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck && npm run lint && npm test
```

Data is an in-memory mock (`src/lib/services/mock`, fixtures in `src/mock`):
forum posts and page edits last until the server restarts; member uploads are
written to `.data/uploads`. Sign-in is simulated as the member 青空.

## Illustrations

Generated with `tools/gen-images.mjs` / `tools/edit-image.mjs` against an
OpenAI-compatible image API. The key is read from the environment only
(`PW_IMAGE_API_KEY`, `PW_IMAGE_BASE_URL`) and is never committed. After
generating, `tools/prepare-*.mjs` cut the paper ground to alpha and write WebP.

## Licence

- Code: Apache License 2.0 — see `LICENSE`.
- AI-generated illustrations under `public/`: CC BY 4.0 — see `LICENSE-ILLUSTRATIONS.md`.
