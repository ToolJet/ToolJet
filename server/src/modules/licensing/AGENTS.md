# licensing module

Decrypts and validates the instance license key, materializes it into a `Terms` object (feature
flags + seat/resource limits), and exposes it to every other module via `LicenseTermsService` and
license guards. CE ships the plumbing but always resolves to basic-plan terms; real decryption,
singleton reload, and cloud per-organization licenses live in `server/ee/licensing/`.

## Domain terms

- **License** — decrypted key wrapped in a `LicenseBase` subclass; EE holds it as a process-wide singleton (`License.Instance()` / `License.Reload()`).
- **License Type** — `LICENSE_TYPE`: `basic | trial | business | enterprise` (`constants/index.ts`). Invalid/expired always reports `basic`.
- **Terms** — `interfaces/terms.ts`: expiry, limits (`apps`, `workspaces`, `users.{total,editor,viewer,superadmin}`, `database.table`), `features.{oidc,auditLogs,ldap,saml,gitSync,...}`, `workflows`, `app`, `ai`, `plan`.
- **Feature flag** — boolean in `Terms.features`, queried through `LICENSE_FIELD` enum keys (e.g. `LICENSE_FIELD.GIT_SYNC` → `gitSyncEnabled`).
- **LICENSE_LIMIT.UNLIMITED** — string sentinel `'UNLIMITED'` for uncapped limits.

Plan code-id ↔ user-facing name (`PLAN_DETAILS`, `constants/index.ts`):

| code-id | user-facing | notes |
|---|---|---|
| `basic` | Basic Plan (free tier) | CE fallback; EE basic = 2 builders / 50 end users / 2 apps |
| `flexible` | Pro | `plan.isFlexible === true` in terms |
| `business` | Team | |
| `enterprise` | Enterprise | default `licenseType` when a valid license omits `type` |

Cloud plan presets: `STARTER/BASIC/PRO/TEAM_PLAN_TERMS_CLOUD` in `ee/licensing/constants/PlanTerms.ts`.

## Key files

| File | Role |
|---|---|
| `interfaces/terms.ts` | `Terms` interface (canonical license shape) |
| `constants/index.ts` | `LICENSE_FIELD`, `LICENSE_TYPE`, `LICENSE_LIMIT`, `PLAN_DETAILS`, `FEATURE_KEY` |
| `constants/PlanTerms.ts` | CE `BASIC_PLAN_TERMS` (mostly UNLIMITED, features off) |
| `configs/LicenseBase.ts` | Getter per term; falls back to injected `BASIC_PLAN_TERMS` when invalid/expired |
| `helper.ts` | `getLicenseFieldValue(LICENSE_FIELD, licenseInstance)` — field→getter switch |
| `services/terms.service.ts` | `LicenseTermsService.getLicenseTerms(field(s), organizationId)` — the read API |
| `services/init.service.ts` | CE no-op init (`License.Reload('')` → invalid → basic) |
| `services/user.service.ts` + `services/count.service.ts` | Seat-limit payloads (editor/viewer/superadmin counts) |
| `repository.ts` | Reads `instance_settings` row `key='LICENSE_KEY'`; per-request memo via `RequestContext` |
| `guards/feature.guard.ts` | Throws HTTP **451** if term falsy; feature id via `@RequireFeature()` (`src/modules/app/decorators/require-feature.decorator.ts`) or `setFeatureId()` |
| `guards/sso.guard.ts` etc. | Wrap `FeatureGuard` with a fixed `LICENSE_FIELD` per resource |
| `ee/licensing/services/decrypt.service.ts` | RSA `publicDecrypt` with `ee/keys/public.pem` + zlib inflate; license format v2/v3 |
| `ee/licensing/services/init.service.ts` | Singleton reload from DB or `TJ_LICENSE` env; `initForMigration()` |
| `ee/licensing/configs/License.ts` / `organization-license.ts` | EE instance singleton / Cloud per-org license |
| `ee/licensing/services/terms.service.ts` | Cloud: fetches org license from PostgREST (`ORGANIZATION_LICENSE_URL`) |
| `ee/licensing/util.service.ts` | `updateLicense()`, trial generation (`LICENSE_TRIAL_API`), seat validation |

## Edition split

- DI tokens are abstract classes in `interfaces/IService.ts`; `module.ts` binds CE or EE impls via `getImportPath()`.
- CE: no decryption; `LicenseInitService.init()` reloads an empty key → `isValid=false` → every getter serves CE `BASIC_PLAN_TERMS`.
- EE (self-host): key stored in `instance_settings` (`LICENSE_KEY`) or `TJ_LICENSE` env var; one license per instance.
- Cloud: per-organization license rows fetched over PostgREST; `organizationId` is mandatory for `getLicenseTerms` (throws otherwise); missing row → cloud basic/starter defaults.

## Invariants & gotchas

- `users.editor` / `users.viewer` in terms = **Builder** / **End User** user-facing (`LICENSE_LIMITS_LABEL`). Never surface "editor/viewer" in UI copy.
- Expiry: `expiry` is `YYYY-MM-DD`, valid until `23:59:59` that day. Expired or unparseable key ⇒ `IsBasicPlan` ⇒ silent fallback to basic terms — no hard errors. Cloud grace period comes from the `expiry_with_grace_period` column, not `Terms.expiry`.
- CE `BASIC_PLAN_TERMS` ≠ EE `BASIC_PLAN_TERMS`: CE is UNLIMITED users/apps with features off; EE basic is 2 builders / 50 end users / 2 apps.
- `NODE_ENV=test` + no license data ⇒ `LicenseBase` fabricates a valid license (30-min expiry, most flags on). Tests exercise licensed paths by default.
- Feature denial is HTTP **451**, not 403 — clients key on this for upgrade prompts.
- Trial keys can't be replaced via `updateLicense()` once a paid key was set (EE util.service throws).
- `LicenseRepository.getLicense()` memoizes per request; a tx-bound `manager` bypasses the memo.
- Valid license without `type` defaults to `enterprise`; trial licenses still get basic-plan `workflows` limits.

## Related modules

- `src/modules/instance-settings` — owns the `instance_settings` table storing `LICENSE_KEY`.
- `src/modules/organization-payments` (+ `ee/organization-payments`) — plan purchase/subscription flows around `PLAN_DETAILS`.
- `src/modules/group-permissions` — gates custom groups (`LICENSE_FIELD.CUSTOM_GROUPS`) and enforces builder/end-user seat limits on role changes.
- `src/modules/users` — `LIMIT_TYPE` seat checks route through `LicenseUserService` / `LicenseCountsService`.
