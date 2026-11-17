# app-usage-analytics module

Workspace-admin dashboards of how released apps are used (glossary: **Usage analytics**, **App open**, **Active user**, **Lifecycle group**, **Reach**). EE/Cloud only, licence field `APP_USAGE_ANALYTICS` (`appUsageAnalytics` feature key; off on the free/basic plans). V1 counts app opens; V2 will add query runs in a separate table.

## Key files

| File | Role |
|---|---|
| `module.ts` | CE: controller only (`status` answers 501; data routes answer 451 when unlicensed, else 501). EE/Cloud: queue `app-usage-analytics`, listener + partition scheduler (runtime), processor (`WORKER=true`), repository |
| `controller.ts` | `GET /api/analytics/{status, workspace/summary, workspace/active-users, workspace/apps, apps/:appId/summary, apps/:appId/active-users, apps/:appId/users}`; JwtAuthGuard + admin-only ability; strict DTOs in `dto/` |
| `service.ts` | CE contract; every method throws 501 |
| `constants/`, `types/` | Feature keys, `APP_OPENED_EVENT`, `AppOpenedEvent` (Segment `track` shape) |
| `server/ee/app-usage-analytics/service.ts` | Metrics; 5-minute per-instance response cache |
| `server/ee/app-usage-analytics/repository.ts` | All SQL (writes and reads) |
| `server/ee/app-usage-analytics/metrics.ts` | Pure helpers: period math, buckets, batch aggregation, partition names |
| `server/ee/app-usage-analytics/{listener,processor,scheduler}.ts` | Event → queue; batched upserts; monthly partitions |

## Flow

`AppsService.validateReleasedApp` (released link only; a signed-in user, or a signed-in workspace member on a public app via `PublicAppViewerGuard`) → `eventEmitter.emit(APP_OPENED_EVENT)` → EE listener `queue.add` (not awaited) → processor buffers jobs, flushes every 5 s or 500 jobs in one transaction, then acknowledges them.

## Invariants & gotchas

- Tracking never blocks or fails a request: the emit is sync fire-and-forget and the listener swallows queue errors.
- Emit only from `validateReleasedApp`. `/apps/slugs/:slug` is cached in the browser (IndexedDB), so it would undercount; editor and preview use `validate-private-app-access`. Public apps skip JWT in `AppAuthGuard`; `PublicAppViewerGuard` resolves a signed-in workspace member anyway into `tj_public_app_viewer` (never `request.user`, so permission checks stay anonymous). Anonymous visitors are never tracked.
- "Production" = opened through the released link. Without multi-environment licensing a release may come from the development environment.
- Upserts are idempotent (`LEAST`/`GREATEST`, no counters); a retried batch changes nothing. Inserts join `apps`/`users` so a deleted app or user skips its rows instead of failing the batch. Rows go in key order so concurrent batches cannot deadlock.
- Every repository read filters on the workspace; app-scoped reads add `app_id` on top, so a caller that skips `requireApp` still cannot read another workspace's app.
- Reactivated = active now, not active in the previous period, first seen before the range start. New + Retained + Reactivated always equals the distinct active users, even when previous-period daily rows are gone.
- `day` is the UTC date of the server timestamp. First-seen timestamps are compared to range bounds as UTC dates.
- Weekly/monthly counts are distinct users per bucket, never sums of days. Day/week buckets count from each period's start so current and previous align by index.
- Rows cascade on user, app and workspace delete (FKs). Removing a user from a workspace keeps their history; the users list returns `removed: true` with no name/email.
- Partitions: the migration seeds the current + next two months and a DEFAULT partition. The scheduler (boot + daily 03:00, `pg_try_advisory_xact_lock`) creates months ahead, moving any DEFAULT rows of that month first, and drops months older than `DAILY_RETENTION_MONTHS` (13), with a 5 s `lock_timeout`. First-seen tables never expire.
- When a range's previous period starts before the oldest kept month, `range.previousAvailable` is false and previous-period numbers (count, trend, retention, previous series) are null/empty rather than undercounted. The lifecycle split can still move users from Retained to Reactivated in that case.
- Workspaces whose plan lacks the feature keep only `UNLICENSED_RETENTION_DAYS` (60) of daily rows (scheduler trim after partition upkeep). The licence is read with `{ strict: true }`, so a failed Cloud licence fetch skips the workspace instead of deleting its history.
- Reach denominator: active workspace members in groups with view/edit on the app (or all apps) plus the admin group; computed from today's permissions.
- TODO: the licence check is switched off for now (`APP_USAGE_ANALYTICS_LICENCE_CHECK = false` in `licensing/configs/LicenseBase.ts`), so every EE/Cloud workspace is licensed. Turn it back on before release.
- Env: `ANALYTICS_ENABLED=false` stops collection and shows the "turned off" page (default on). There is no separate UI switch: the dashboards show as soon as the workspace is licensed.

## Tests

- `server/ee/test/modules/app-usage-analytics/unit/metrics.spec.ts` — pure helpers.
- `server/ee/test/modules/app-usage-analytics/unit/background.spec.ts` — listener (never throws), processor batching (5 s / 500, failed batch rejects all, flush on shutdown), scheduler lock, unlicensed trim.
- `server/ee/test/modules/app-usage-analytics/e2e/app-usage-analytics.spec.ts` — merge rules, every endpoint, admin-only, workspace scoping (HTTP and repository), week/month buckets, previous period past retention, emit (incl. public apps), partitions, random-data lifecycle invariants (incl. a deleted app).
- `server/test/modules/app-usage-analytics/e2e/` — CE answers 501 under the test licence.

## Related modules

- `apps` — emits the event; `PublicAppViewerGuard`.
- `licensing` — `LICENSE_FIELD.APP_USAGE_ANALYTICS`.
- `group-permissions` — reach query mirrors `findUserGroupsWithAppAccess`.
