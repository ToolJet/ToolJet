# Codebase Concerns

**Analysis Date:** 2026-06-29

## Tech Debt

**Incomplete JS→TS migration (frontend):**
- Issue: Frontend is overwhelmingly untyped — `2374` `.js`/`.jsx` files vs only `2` `.ts`/`.tsx` files under `frontend/src`. New-file convention says prefer TypeScript (see `.claude/CLAUDE.md`), but the existing surface has almost no type safety.
- Files: `frontend/src/**` (entire tree)
- Impact: No compile-time safety on the largest part of the app; refactors are risky, props/state contracts are implicit, runtime errors instead of build errors.
- Fix approach: Migrate leaf modules and shared utilities (`frontend/src/_helpers/utils.js`) to `.ts` incrementally; type the Zustand slices first since they are central state.

**Server type-escape hatches:**
- Issue: `687` occurrences of `@ts-ignore`, `: any`, or `as any` across `server/src/**/*.ts`. Despite the server being TS-first, type guarantees are frequently bypassed.
- Files: widespread across `server/src`
- Impact: Erodes the value of TypeScript; hidden contract mismatches at module boundaries.
- Fix approach: Track and burn down `any`/`@ts-ignore` per module; enable stricter lint rule once counts drop.

**Lint suppression density (frontend):**
- Issue: `580` `eslint-disable` directives across `frontend/src`.
- Files: widespread in `frontend/src`
- Impact: Lint signal is muted; real issues hide behind blanket disables.
- Fix approach: Audit disables; convert blanket file-level disables to scoped line-level with justification.

**Oversized modules (god files):**
- Issue: Several files far exceed maintainable size and concentrate responsibility.
- Files:
  - `frontend/src/AppBuilder/_stores/slices/componentsSlice.js` (3563 lines)
  - `frontend/src/HomePage/HomePage.jsx` (2056)
  - `frontend/src/TooljetDatabase/Table/index.jsx` (1804)
  - `frontend/src/AppBuilder/_stores/slices/queryPanelSlice.js` (1745)
  - `frontend/src/_helpers/utils.js` (1492)
  - `frontend/src/AppBuilder/AppCanvas/Grid/Grid.jsx` (1483)
  - `server/src/modules/apps/services/app-import-export.service.ts` (3510)
  - `server/src/modules/tooljet-db/services/tooljet-db-table-operations.service.ts` (1670)
  - `server/src/modules/data-sources/util.service.ts` (1048)
- Impact: High cognitive load, merge conflicts, hard to test, fragile to change.
- Fix approach: Extract cohesive sub-modules (e.g. split Zustand slices by domain; split import/export service by resource type).

**TODO/FIXME backlog:**
- Issue: `32` markers in `server/src`, `86` in `frontend/src`. Several flag known unfinished work (audit logs, permission checks, data-migration cleanups).
- Files:
  - `server/src/modules/folder-apps/service.ts:32,49` — missing org-scope and edit-permission checks (security-relevant TODOs)
  - `server/src/modules/files/ability/index.ts:18` — "Add permissions. Only admin and builders can view all, viewer can view only self" (unenforced authorization)
  - `server/src/modules/data-queries/service.ts:373` — disabled data-source-kind check for workflows
  - `server/src/modules/versions/util.service.ts:119,132` and `server/src/modules/data-queries/service.ts:379` — missing audit logs
  - `server/src/modules/plugins/util.service.ts:96,390` — plugin file cleanup never happens on uninstall
- Impact: Mix of missing authorization, missing audit trails, and storage leaks.
- Fix approach: Triage the security/permission TODOs first (see Security section), then audit-log TODOs, then cleanup.

**REST API `json_body` → `raw_body` data migration in flight:**
- Issue: Coordinated frontend FIXMEs awaiting completion of a data migration; transitional dual-path code.
- Files: `frontend/src/AppBuilder/QueryManager/QueryEditors/Restapi/index.jsx:23,231`, `TabContent.jsx:11`, `TabBody.jsx:6,28`, `Tabs.jsx:109`
- Impact: Branching logic that must be removed in lockstep once migration completes; risk of stale code paths.
- Fix approach: Confirm migration completion, then remove all FIXME-tagged `json_body` fallbacks together.

## Known Bugs

**PhoneInput stale calling code:**
- Symptoms: Changing `country` alone leaves the old calling code on the value (e.g. country "US" with a "+91..." number still resolves to IN).
- Files: `frontend/src/AppBuilder/Widgets/PhoneCurrency/PhoneInput.jsx:101`
- Trigger: Switch country prop without re-entering the number.
- Workaround: Re-enter the number after country change.

**Intermittent null `currentEnvironment`:**
- Symptoms: `currentEnvironment` is intermittently null; guarded by a TODO-tagged workaround rather than a root-cause fix.
- Files: `server/src/modules/data-queries/util.service.ts:48`
- Trigger: Race/timing in environment resolution during query execution.
- Workaround: Defensive null handling already present in code.

## Security Considerations

**Client-side dynamic code execution (eval surface):**
- Risk: User-authored app code (transforms, JS queries, binding expressions) is executed in the browser via dynamically constructed functions. This is core product behavior but is the highest-value attack/abuse surface.
- Files: `frontend/src/AppBuilder/_stores/slices/queryPanelSlice.js:1570` (`new Function(...)` building an `AsyncFunction`), `frontend/src/AppBuilder/_helpers/libraryLoader.js`, resolver chain in `frontend/src/_helpers/utils.js`, `frontend/src/AppBuilder/_utils/component-properties-resolution.js`, `frontend/src/AppBuilder/CodeEditor/utils.js`
- Current mitigation: Execution scoped to the app runtime/sandboxed evaluation context; same-origin app data only.
- Recommendations: Centralize and document the single eval entry point; ensure no untrusted cross-tenant code reaches these resolvers; keep CSP from broadening (see below).

**`dangerouslySetInnerHTML` usage (XSS surface):**
- Risk: Raw HTML rendering of user/data-driven content.
- Files: `frontend/src/AppBuilder/Widgets/Html.jsx`, `Text.jsx`, `DraftEditor.jsx`, `SvgImage.jsx`, `frontend/src/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer.jsx`, `StringRenderer.jsx`, `TextRenderer.jsx`, `frontend/src/AppBuilder/QueryManager/QueryEditors/Openapi.jsx`, `frontend/src/AppBuilder/AppCanvas/WidgetTooltip.jsx`
- Current mitigation: Some renderers (e.g. HTML widget) are intentional user-controlled output.
- Recommendations: Verify each call sanitizes (DOMPurify or equivalent) before injection; audit the data-type renderers, which display query results.

**Unenforced authorization TODOs:**
- Risk: Folder operations and file abilities lack org-scope / role checks per inline TODOs.
- Files: `server/src/modules/folder-apps/service.ts:32,49`, `server/src/modules/files/ability/index.ts:18`
- Current mitigation: Upstream guards may cover some paths; not verified per-endpoint.
- Recommendations: Add explicit org-scope and permission assertions; treat as security bug, not cleanup.

**CSRF / cookie / CORS / CSP configuration:**
- Risk: CSRF protection and SameSite behavior change when custom domains are enabled (cookies forced to `SameSite=None`), widening cross-site cookie acceptance. CORS wildcard and CSP whitelist are env-driven.
- Files: `server/src/helpers/bootstrap.helper.ts` (`setupCsrfOriginCheck` ~L271, `setSecurityHeaders` ~L339, helmet/CSP ~L408, `ENABLE_CORS`/`CSP_WHITELISTED_DOMAINS` handling), `server/src/main.ts`
- Current mitigation: Origin-check middleware for cookie auth; helmet CSP; certain paths (API keys, SAML, webhooks) intentionally excluded from CSRF check at `bootstrap.helper.ts:278`.
- Recommendations: Audit the CSRF-excluded path list against current routes; confirm `ENABLE_CORS=true` wildcard is never default in production; review CSP for `unsafe-eval`/`unsafe-inline` needed by the eval surface above.

**Secrets / env handling:**
- Risk: Secrets supplied via env (`PG_PASS`, `TOOLJET_DB_URL`, JWT secret, AI provider keys, OIDC). `.env`/`.env.test` are gitignored.
- Files: config consumed in `server/ormconfig.ts`, `server/src/helpers/redis.ts`, `server/src/main.ts`
- Current mitigation: `.env` gitignored per `.claude/CLAUDE.md`.
- Recommendations: Ensure no secrets logged — note `73` `console.log` calls in `server/src` (see Performance/Logging); audit those for accidental secret/PII leakage.

## Performance Bottlenecks

**BullMQ workflow execution + Redis dependency:**
- Problem: Workflow execution and scheduling run through BullMQ queues backed by Redis; queue/state model is acknowledged as overly complex.
- Files: `server/src/modules/workflows/processors/workflow-execution.processor.ts`, `workflow-schedule.processor.ts`, `server/src/modules/workflows/constants/queue-config.ts`, `server/src/modules/app-history/queue/history-queue.processor.ts`, `frontend/src/_utils/workflowExecutionState.js:3` ("We need to simplify states across the board (DB, BullMQ, frontend)")
- Cause: Workflow state is duplicated/derived across DB, BullMQ, and frontend with no single source of truth.
- Improvement path: Define one canonical state machine; reconcile the three representations; add backpressure/concurrency config review in `queue-config.ts`.

**Redis as hard runtime dependency:**
- Problem: Redis used for queues, caching (custom domains), and app loading.
- Files: `server/src/helpers/redis.ts`, `server/src/modules/custom-domains/cache.service.ts`, `server/src/modules/app/loader.ts`
- Cause: Single shared Redis client/connection model.
- Improvement path: Verify connection pooling and failure handling (graceful degradation when Redis is down).

**Large import/export service:**
- Problem: `app-import-export.service.ts` (3510 lines) handles full app graph import/export synchronously.
- Files: `server/src/modules/apps/services/app-import-export.service.ts`
- Cause: Monolithic resource handling.
- Improvement path: Stream/batch large app payloads; profile on large apps.

## Fragile Areas

**Zustand state slices (AppBuilder):**
- Files: `frontend/src/AppBuilder/_stores/slices/componentsSlice.js` (3563), `queryPanelSlice.js` (1745), `eventsSlice.js` (1467), `resolvedSlice.js` (971), `frontend/src/AppBuilder/_stores/utils/dynamicHeightReflow.js` (1440)
- Why fragile: Central app-builder state, huge, untyped, mutated via Immer with interdependencies; touching one slice can cascade.
- Safe modification: Change one action at a time; manually verify in the builder UI (no frontend test harness — see below).
- Test coverage: Essentially none.

**Migration coupling (two datasources):**
- Files: `server/migrations/` (202 migration files), `server/src/migration-helpers/db-migrations-datasource.ts`, `data-migrations-datasource.ts`, `server/ormconfig.ts`
- Why fragile: `db:migrate` runs both schema and data migrations; a misordered or failing data migration can leave schema/data inconsistent. Secondary ToolJet DB (`TOOLJET_DB_URL`) adds a second migration surface.
- Safe modification: Always create new timestamped migrations (never edit applied ones); test against a seeded DB; run schema and data migration sets together.
- Test coverage: Migration correctness not unit-tested.

**Plugin surface (48 connectors):**
- Files: `plugins/packages/*/` (48 packages), shared `@tooljet-plugins/common`
- Why fragile: Independent Lerna versioning + esbuild pipeline; a change to `common` ripples across all 48. Plugin uninstall leaves orphaned files (`server/src/modules/plugins/util.service.ts:96,390`).
- Safe modification: Bump and test `common` changes against representative connectors; never assume a connector follows the same shape.
- Test coverage: Per-package `__tests__/` exists but coverage varies by connector.

## Test Coverage Gaps

**Frontend has effectively no automated tests:**
- What's not tested: Almost the entire `frontend/src` tree — only `4` `*.test.js(x)` files exist for `2374` source files. Per project memory, frontend tests are intentionally not added (manual verification).
- Files: `frontend/src/**`
- Risk: Regressions in the app builder (state slices, canvas, query panel) ship undetected; refactors are unverifiable except manually.
- Priority: High (mitigated only by manual QA policy)

**Server coverage is thin relative to size:**
- What's not tested: `47` spec/e2e files for `1063` server `.ts` files. Large services (import/export, tooljet-db operations) and workflow processors lack focused tests.
- Files: `server/src/modules/apps/services/app-import-export.service.ts`, `server/src/modules/workflows/processors/*`, `server/src/modules/tooljet-db/services/*`
- Risk: Data-corruption and authorization regressions in the highest-blast-radius services.
- Priority: High

**Migration tests absent:**
- What's not tested: Schema/data migration correctness and ordering.
- Files: `server/migrations/*`
- Risk: Broken upgrades in production.
- Priority: Medium

## Dependencies at Risk

**OIDC / openid-client timeout coupling:**
- Risk: Global OIDC HTTP timeout set process-wide in `server/src/main.ts` (`custom.setHttpOptionsDefaults`); a slow IdP affects all OIDC flows.
- Impact: Login failures/latency under IdP degradation.
- Migration plan: Per-request timeout config; circuit-breaker on IdP calls.

**OTEL tracing must load first:**
- Risk: `import './otel/tracing'` is required to be the first import in `server/src/main.ts` to patch modules; any import reordering silently breaks instrumentation.
- Files: `server/src/main.ts:1`, `server/src/otel/tracing.ts` (has open TODO at L68)
- Impact: Lost observability if violated.
- Migration plan: Add a lint/CI guard asserting the first-import invariant.

## Missing Critical Features

**Plugin file cleanup on uninstall:**
- Problem: Uninstalling a plugin does not delete associated files / stale spec files.
- Files: `server/src/modules/plugins/util.service.ts:96,390`
- Blocks: Clean plugin lifecycle; leads to storage accumulation and stale specs.

**Audit logs incomplete:**
- Problem: Several mutating operations have TODO-marked missing audit logs.
- Files: `server/src/modules/versions/util.service.ts:119,132`, `server/src/modules/data-queries/service.ts:379`
- Blocks: Complete audit trail / compliance reporting.

---

*Concerns audit: 2026-06-29*
