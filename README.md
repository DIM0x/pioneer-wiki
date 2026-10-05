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

The default data source is an in-memory mock (`src/lib/services/mock`, fixtures
in `src/mock`): forum posts and page edits last until the server restarts;
member uploads are written to `.data/uploads`. When
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present,
the auth adapter switches to Supabase Auth while content remains on the mock
repository until a content migration is selected. Set `PIONEER_DATA_SOURCE=mock`
to force the local simulated account.

## Authentication deployment

1. Create a Supabase project and configure email/password auth plus the site URL
   and redirect URL `/auth/callback`.
2. Copy `.env.example` to `.env.local` and set the public project URL/key. Keep
   `SUPABASE_SERVICE_ROLE_KEY` server-only; it is used only by
   `npm run bootstrap-admin`.
3. Run `supabase/migrations/202610050001_accounts.sql` in the Supabase SQL
   editor or through the Supabase CLI.
4. After the first account verifies its email, set `PIONEER_ADMIN_EMAILS` and
   run `npm run bootstrap-admin` to promote the initial administrator.

Registration, email verification, password reset, logout, verified-email write
gates, account closure requests, profile RLS and author/member binding helpers
are implemented. Accounts and public member pages remain separate: only an
administrator can bind a wiki author or member record to an account.

## Illustrations

Generated with `tools/gen-images.mjs` / `tools/edit-image.mjs` against an
OpenAI-compatible image API. The key is read from the environment only
(`PW_IMAGE_API_KEY`, `PW_IMAGE_BASE_URL`) and is never committed. After
generating, `tools/prepare-*.mjs` cut the paper ground to alpha and write WebP.

## Licence

- Code: Apache License 2.0 — see `LICENSE`.
- AI-generated illustrations under `public/`: CC BY 4.0 — see `LICENSE-ILLUSTRATIONS.md`.
