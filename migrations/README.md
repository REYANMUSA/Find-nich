# Find Niche — Production Architecture

## Live architecture

- **Frontend:** Vite + React hosted on Vercel.
- **API:** Supabase Edge Function `find-niche-api`.
- **Database:** Supabase Postgres; product/catalog/branding/session data does not depend on an ephemeral Vercel filesystem.
- **API routing:** Root `vercel.json` rewrites `/api/*` to the Edge Function while preserving the frontend's same-origin API calls.
- **Image uploads:** Supabase Storage bucket `find-niche-images`, created on first authorized upload.
- **Authentication:** Owner passcode hash stored in `admin_config`; random session tokens are returned for the existing client bearer fallback, while only their SHA-256 hashes are stored in `admin_sessions`. Login attempts and outbound click tracking use hash-only rate-limit records.

## Required secrets

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime. The service-role key must never be shipped to the browser or committed to this repository.

## Database schema

- `migrations/001_initial_schema.sql` creates catalog, click, audit, session, settings and rate-limit tables using text identifiers compatible with the existing `cat-*` and `prod-*` IDs.
- `migrations/002_rls_policies.sql` enables RLS and restricts direct public access to active categories, published products and eligible click inserts. Privileged access is handled by the Edge Function.

These files document the schema already used by the live project. Do not rerun destructive migrations against the live database. The production catalog has been seeded from `data/db.json`; migrations intentionally do not reset or overwrite it.

## Run locally

- `npm run dev` starts the Express development server plus Vite.
- `npm run build` builds the frontend.
- `npm run lint` runs TypeScript checks.

The local Express/SQLite path is for development only. Production requests must use the deployed Supabase Edge Function.
