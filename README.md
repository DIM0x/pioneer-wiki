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

The default local data source is an in-memory mock (`src/lib/services/mock`,
fixtures in `src/mock`), so contributors do not need Docker or a shared
database. Set `PIONEER_DATA_SOURCE=supabase` to use the persistent content,
community, search, auth and Storage adapters. In production, Supabase is the
source of truth; public readers see published revisions while authors see their
own drafts and administrators see all revisions. Member uploads use the
`member-covers` Storage bucket when Supabase is enabled.

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
5. Apply migrations with the Supabase CLI from the repository root, then seed
   the existing fixtures with `npm run seed-supabase` (requires the service-role
   key). The seed is idempotent and may be re-run after a clean database reset.

Registration, email verification, password reset, logout, verified-email write
gates, profile RLS, content RLS, optimistic revision conflicts and author/member
binding helpers are implemented. Accounts and public member pages remain
separate: only an administrator can bind a wiki author or member record to an
account. All content mutations are recorded in the append-only audit log.

## Illustrations

Generated with `tools/gen-images.mjs` / `tools/edit-image.mjs` against an
OpenAI-compatible image API. The key is read from the environment only
(`PW_IMAGE_API_KEY`, `PW_IMAGE_BASE_URL`) and is never committed. After
generating, `tools/prepare-*.mjs` cut the paper ground to alpha and write WebP.

## Licence

- Code: Apache License 2.0 — see `LICENSE`.
- AI-generated illustrations under `public/`: CC BY 4.0 — see `LICENSE-ILLUSTRATIONS.md`.
