# Supabase plugin: multi-key auth, PostgreSQL connection string, SQL mode

## Context
The Supabase marketplace plugin ([lib/index.ts](marketplace/plugins/supabase/lib/index.ts)) wraps only `@supabase/supabase-js` (PostgREST) with one auth style (Project URL + service-role key) and 5 GUI row operations. Goals: support the Publishable key and the Secret key, add a PostgreSQL connection-string mode, add SQL mode, keep existing data sources working via a migration, and base the Postgres side on the existing postgresql plugin's patterns.

## Findings

### A. Connecting a free account today
Project Settings → API: **Project URL** `https://<ref>.supabase.co` plus the `service_role` key, stored as `project_url` and `service_role_secret` (encrypted). The service role bypasses RLS. Only the exposed `public` schema is reachable and the table field takes a bare table name. Free projects pause after about 7 days of inactivity. `testConnection` calls `from('').select('1')`.

### B. Can supabase-js run raw SQL? No.
PostgREST only exposes table CRUD and `rpc()` of pre-existing functions. The workarounds are poor:
- `rpc('exec_sql')` needs a user-created arbitrary-SQL function (security risk, manual setup).
- The Management API `/v1/projects/{ref}/database/query` needs a separate `sbp_` personal access token and is rate-limited.

**Decision: SQL mode is available only via the connection string (direct Postgres through knex with the `pg` driver).** Free tier caveat: the direct host `db.<ref>.supabase.co:5432` is IPv6-only, so help text should recommend the Session pooler (`:5432`) or Transaction pooler (`:6543`). SSL is required.

### C. How the postgresql plugin does it ([plugins/packages/postgresql/lib/index.ts](plugins/packages/postgresql/lib/index.ts))
| Concern | Postgres plugin | Take for Supabase |
|---|---|---|
| **Pool** | `knex({client:'pg', pool:{min:0,max:10,acquireTimeoutMillis:10000}, acquireConnectionTimeout:60000})` per data source (`buildConnection`, line 858). | **Use knex only (decided), not `pg.Pool` directly.** Same `client:'pg'` config, with a smaller `max` (about 5) since poolers cap connections on the free tier. `pg` is only knex's driver dependency. |
| **Connection save/cache** | `getConnection(..., checkCache)` caches the knex instance in a module-level `CACHED_CONNECTIONS` keyed by `${dataSourceId}_${sha256(sourceOptions)}`. It is invalidated when `dataSourceUpdatedAt` is newer, and old keys for the same data source are evicted (`generateSourceOptionsHash`/`cacheConnectionWithConfiguration` in [plugins/packages/common/lib/utils.helper.ts](plugins/packages/common/lib/utils.helper.ts)). | The **marketplace** `common` lib only has `cacheConnection(dataSourceId, conn)` and `getCachedConnection(dataSourceId, updatedAt)` (no hash, no old-key eviction). Add `generateSourceOptionsHash` and `cacheConnectionWithConfiguration` to [marketplace/plugins/common/lib/utils.helper.ts](marketplace/plugins/common/lib/utils.helper.ts) (copied from the core common) and use them so a changed connection string is not served from a stale pool. `run()` must take the 4th param `dataSourceUpdatedAt`. |
| **Parameterised queries** | In SQL mode, `query_params` (key/value pairs) are sent to `knex.raw(query, {name: value})`, which uses **named bindings `:name`**. With no params it runs `pgConnection.query(query)` on an acquired pool connection. | Same: `knex.raw(query, namedParams)` through the same `query_params` UX and `:name` convention. No custom converter needed. |
| **Errors** | Maps `code`, `detail`, `hint`, `routine` into `QueryError`. | Same mapping. |
| **Connection string** | Postgres plugin's `string` mode parses the URL but then overrides every part with the UI fields (`buildConnection` lines 803-829; the parsed values are unused). | Do **not** copy this quirk. Pass the string straight to knex (`connection: { connectionString, ssl }`) and parse `sslmode` only to set `ssl`. |
| **Cleanup** | Cached instances are never destroyed. Non-cached ones are destroyed in `finally`. | Same. |
| **Timeout** | `statement_timeout` on non-cloud editions. | Same (`tooljet_edition` handling, if exposed). |

### D. Keys
- **Secret key** (`sb_secret_...` or the legacy `service_role` JWT): the existing `service_role_secret` field, full access, bypasses RLS.
- **Publishable key** (`sb_publishable_...` or the legacy `anon` JWT): new field `publishable_key`, subject to RLS (so row ops return only what policies allow; an empty result is expected, not an error).
- Both use the same `createClient(project_url, key)`. The pinned `@supabase/supabase-js ^2.41.1` predates the `sb_` key format, so bump to a current 2.x and verify with the new key formats against a real free project.

## Design

### Manifest ([manifest.json](marketplace/plugins/supabase/lib/manifest.json))
Single `connection_type` dropdown (`dropdown-component-flip`, same pattern as [weaviate](marketplace/plugins/weaviate/lib/manifest.json)), `defaults.connection_type = secret_key`:
1. `secret_key`: "Secret key": `project_url`, `service_role_secret` (existing keys, unchanged).
2. `publishable_key`: "Publishable key": `project_url`, `publishable_key` (new).
3. `connection_string`: "Connection string (PostgreSQL)": `connection_string` (password type, encrypted), optional `ssl_enabled` and `ssl_certificate` (reuse Postgres' `getSslConfig` semantics), help text about the pooler.
Shared `project_url` is declared in both API groups. Add all new keys to `source.options`; the encrypted ones are `publishable_key`? (no, publishable is public, so not encrypted), `connection_string` (encrypted). Replace the static `required` list with per-mode validation in code (verify frontend behaviour with flip groups).

### Operations ([operations.json](marketplace/plugins/supabase/lib/operations.json))
Operation lists cannot depend on source options. Add `sql_query` ("Run SQL"): a SQL `query` codehinter plus `query_params` (key/value, as in the Postgres plugin's [operations.json](plugins/packages/postgresql/lib/operations.json)). Runtime guard:
- API modes accept the five row ops; `sql_query` returns "Run SQL needs Connection string mode".
- Connection-string mode accepts `sql_query` only; row ops return "Row operations need a Secret/Publishable key connection".

### Code ([index.ts](marketplace/plugins/supabase/lib/index.ts), [types.ts](marketplace/plugins/supabase/lib/types.ts))
- `SourceOptions`: `connection_type?`, `publishable_key?`, `connection_string?`, SSL fields.
- A missing `connection_type` resolves to `secret_key`. This is the code-level backward-compat guarantee for old imports and exported apps.
- `getConnection` branches by mode: supabase-js client for key modes, cached knex instance (`client: 'pg'`) for string mode.
- `run(..., dataSourceId, dataSourceUpdatedAt)` dispatches on mode; the existing 5 operation functions are untouched.
- `testConnection`: key modes keep the REST check (for the secret and publishable key, make sure the empty-table `from('')` check still works; swap it for a root `GET /rest/v1/` if not). String mode runs `knex.raw('SELECT 1')` and then `destroy()`s the temporary instance.
- [package.json](marketplace/plugins/supabase/package.json): add `knex` and `pg` (driver), and bump `@supabase/supabase-js`. Rebuild the committed `dist/`.

### Migration
`server/data-migrations/1790600000000-BackfillSupabaseDatasourceConnectionType.ts`, cloned from [1785283200000-BackfillMssqlDatasourceConnectionType.ts](server/data-migrations/1785283200000-BackfillMssqlDatasourceConnectionType.ts) (batched, idempotent, in a transaction):
- Targets `data_sources.kind = 'supabase'` where `options` has no `connection_type`.
- Sets `connection_type = {"value":"secret_key","encrypted":false}`, since every existing record holds a service-role key.
- `down` removes `connection_type` for `supabase` only.

## Open items to verify first
1. How an updated marketplace manifest reaches installs that already exist (stored manifest, so check whether re-install or upgrade is needed).
2. `required` handling with flip groups in the data source UI.
3. The `sb_publishable_` and `sb_secret_` keys against the bumped supabase-js on a free project.

## Verification
- `cd marketplace/plugins/supabase && npm run build`, then plugin tests from the repo root (add unit tests for mode dispatch and param binding).
- Free Supabase project:
  - Secret key: get/create/update/delete/count (regression).
  - Publishable key: reads follow RLS (empty result with RLS on and no policy; data with a permissive policy).
  - Connection string through the Session pooler: `SELECT now()`, a parameterised query (`WHERE id = :id`), an error case (a `42P01` error surfaces `code`/`hint`), test-connection pass and fail.
  - Cache: edit the data source, then confirm the next query uses a new pool (no stale credentials).
  - Mode/operation mismatch messages.
- Migration: seed a `supabase` data source without `connection_type`, run, confirm `secret_key`; rerun (no-op); run `down`.
- Open an existing Supabase data source and confirm the dropdown shows "Secret key" with fields prefilled.

---

# Implementation summary

Status: implemented and built, with 9 unit tests passing. Not yet tried against a real Supabase project.

## Bug fix: "Invalid relation name" on test connection
- **Root cause:** `testConnection` called `supabaseClient.from('')`. The installed supabase-js (2.106.1, allowed by `^2.41.1`) rejects an empty relation name before sending any request, so the test failed for every key.
- **Fix:** `testConnection` now calls `GET {project_url}/rest/v1/` with the key in the `apikey` header only (the `sb_*` keys are not JWTs). Failures show the API's own message.

## Changes
| Area | File | Change |
|---|---|---|
| Plugin | `marketplace/plugins/supabase/lib/index.ts` | Three connection types; knex-based `runSqlQuery`; cached `getSqlConnection`; mode/operation guards; new `testConnection`. |
| Plugin | `lib/types.ts` | `ConnectionType`, new `SourceOptions` fields, `query` and `query_params`. |
| Plugin | `lib/manifest.json` | `connection_type` dropdown (Secret key / Publishable key / Connection string); new fields `publishable_key`, `connection_string`, `ca_cert`; `required` list removed. |
| Plugin | `lib/operations.json` | New `sql_query` operation ("Run SQL") with `query` and `query_params`. |
| Plugin | `package.json`, `marketplace/package-lock.json` | Added `knex`, `pg`, `@types/pg`. |
| Plugin | `__tests__/index.js` | Tests for key selection, test connection, mode guards and SSL handling (run against `dist`, so build first). |
| Common lib | `marketplace/plugins/common/lib/utils.helper.ts`, `index.ts` | Added `generateSourceOptionsHash` and `cacheConnectionWithConfiguration`; the latter destroys evicted knex instances. |
| Server | `server/data-migrations/1790600000000-BackfillSupabaseDatasourceConnectionType.ts` | Sets `connection_type = secret_key` on existing Supabase data sources; idempotent; has `down`. |

## Behaviour
- A missing `connection_type` is treated as `secret_key`, so old data sources and imported apps keep working.
- Run SQL works only with a connection string. Row operations work only with the two key types. Mismatches return a clear error.
- SQL uses knex with the `pg` driver (pool max 5), `:name` parameters via `knex.raw`, and the same error fields as the Postgres plugin. Without parameters it runs the query directly on a pooled connection, so `:` and `?` in the SQL text are left alone.
- `sslmode` is stripped from the URL and SSL is set explicitly. Without a CA certificate, SSL is on but the certificate is not verified. With one, it is verified.

## Deviations from the plan above
- `dist/` is gitignored in this repo, so nothing built is committed.
- `@supabase/supabase-js` is not pinned; it stays at `^2.41.1`.
- The SSL dropdown was replaced by a single optional CA certificate field.

## Still unverified
1. What a publishable key gets from `/rest/v1/`. The code accepts a 401/403 whose message mentions "schema" or "secret" (a guess).
2. `sb_publishable_` and `sb_secret_` keys through supabase-js.
3. A real connection through the Supabase pooler, and Run SQL.
4. The data migration (not run).
5. How an updated marketplace manifest reaches installs that already exist.
