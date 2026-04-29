# RECON.md — ToolJet Security Audit (Stage 1)

## 1. Audit scope, repository, methodology

- **Target repository.** `https://github.com/ToolJet/ToolJet` — clone at `/home/jeff/tgl/pipe-e5e20590/`.
- **Commit audited.** `8ce1dcca884601405c26f4e049cda27e68dfb5d0` on branch `develop` (latest commit: "Merge pull request #16056 from ToolJet/grype-slack-notify-file-removed", 2026-04-23).
- **Edition focus.** Community Edition (CE). The `server/ee/` directory is empty in this clone; EE/Cloud features whose CE controllers throw `Method not implemented` (workflows webhooks, instance settings, several SCIM controllers, `external-apis/service.ts`) are noted as out-of-scope for code analysis.
- **ToolJet release line.** `package.json` declares `1.18.0` running on Node `22.15.1`/npm `10.9.2`.
- **Allowed testing boundary.** Static analysis and local-only reproduction against this clone. **Do not** probe `tooljet.com`, customer-hosted instances, or any third-party services configured as data sources.
- **Methodology.**
  1. Map repo layout (monorepo: `server/` NestJS + `frontend/` React/webpack + `plugins/` Lerna packages + `cli/` + `docker/` + `deploy/{ec2,helm,kubernetes,openshift}`).
  2. Read bootstrap (`server/src/main.ts`, `server/src/helpers/bootstrap.helper.ts`) for global middleware, security headers, body limits, listener config.
  3. Walk the NestJS module graph from `server/src/modules/app/module.ts` to enumerate controllers, decorators (`@InitModule`, `@InitFeature`), and the ability-guard pattern.
  4. Spot-read auth/session/encryption/data-source/data-query/files/import-export/workflows/ai/scim modules and EE-vs-CE branch points (`getImportPath`, `validateEdition`).
  5. Run four parallel `Explore` agents covering (a) auth/SSO/session, (b) authz/CASL/tenant, (c) data sources / query exec / code-exec sandboxes, (d) secrets/files/import-export/SSRF.
  6. `grep` known sinks: `res.cookie`, `helmet`, `enableCors`, `vm`, `isolated-vm`, `pyodide`, `child_process`, `simple-git`, `got`, `axios`, `eval`, raw SQL builders.
- **Out of scope / assumptions.**
  - Frontend XSS surfaces are not deeply walked here (deferred to later stage); only entry points and sinks reachable from the server are noted.
  - All `server/ee/` code is unavailable in this clone — assume EE adds: SAML/OIDC/LDAP implementations, workflows webhook controllers, SCIM, instance settings UI, AI/agent feature, white-labelling, license validation.
  - Plugin packages under `plugins/packages/<connector>/` are reviewed as authored code; community marketplace plugins (`marketplace/`) are treated as untrusted out-of-tree.
  - Config defaults are read from `.env.example`; deployment-specific overrides (helm charts, terraform) are partly in scope and noted where defaults look unsafe.

---

## 2. Architecture & trust-boundary map

```
                  ┌──────────────────────────────────────────────┐
   browser ─────► │  frontend (React, webpack)                   │  ── public app sharing
                  │  - app builder, query panel, runtime         │
                  │  - JS expressions {{ }} resolved client-side │
                  └─────────────┬────────────────────────────────┘
                                │ tj_auth_token cookie (httpOnly,
                                │ sameSite=strict|none if embed)
                                │ tj-workspace-id header (org scope)
                                ▼
              ┌───────────────────────────────────────────────────┐
              │  NestJS server (Express) — server/src/main.ts     │
              │  - helmet (very permissive CSP)                   │
              │  - cors (origin reflected when ENABLE_CORS=true)  │
              │  - cookie-parser, compression                     │
              │  - global ValidationPipe whitelist+transform      │
              │  - global prefix /api (+ optional SUB_PATH)       │
              │  - Bull-Board /jobs basic-auth                    │
              │  - SCIM /api/scim (separate body parser)          │
              └─────────────┬─────────────────────────────────────┘
                            │
   ┌────────────────────────┼─────────────────────────────────────┐
   │                        │                                     │
   ▼                        ▼                                     ▼
 PostgreSQL (PG_*)     ToolJet DB (TOOLJET_DB_*)            Plugin runner (in-process)
 - users, orgs,        - per-tenant schemas served             - REST/GraphQL/OpenAPI
   sessions, apps,       via PostgREST (PGRST_HOST)            - SQL connectors (pg/mysql/mssql/oracle)
   queries,            - JWT signed with PGRST_JWT_SECRET      - SaaS connectors (slack/sendgrid/etc.)
   credentials         - role = `user_<organizationId>`        - JS exec via isolated-vm
                                                               - object storage (s3/gcs/azureblob/minio)
                            ▲                                     ▲
                            │                                     │
                       Redis (BullMQ for workflows,          External services chosen by
                       sessions, caching)                    workspace builders (no allowlist).
```

**Trust boundaries.**

- **Browser ↔ server.** Single cookie (`tj_auth_token`) carries auth. CSRF defense relies entirely on `SameSite=strict`, which downgrades to `none` whenever `ENABLE_PRIVATE_APP_EMBED=true` is set.
- **Server ↔ PostgreSQL (control plane).** Trusted; encryption-at-rest delegated to deployer.
- **Server ↔ ToolJet DB / PostgREST.** Same DB cluster; isolation via per-org PostgREST roles signed into a 1-minute JWT (`server/src/modules/tooljet-db/services/postgrest-proxy.service.ts:216`).
- **Server ↔ external data sources.** Outbound to *anything* the workspace builder configures — including internal addresses. There is no IP/hostname allowlist or denylist.
- **Workspace ↔ workspace.** Tenancy is enforced **per-query in JS code**, not at the DB row-level. Org scope is selected by the *client-supplied* `tj-workspace-id` header and validated against the JWT's `organizationIds` array (jwt.strategy.ts:62-83).
- **Public apps.** Anonymous traffic can reach `apps/guards/app-auth.guard.ts:33-54`, which looks up apps by globally unique slug and stamps `tj-workspace-id` with the app's `organizationId` itself, then short-circuits the ability guard for any feature that does not opt into `shouldNotSkipPublicApp` (`server/src/modules/app/guards/ability.guard.ts:111-114`).

---

## 3. Attack-surface table (file paths + owning subsystem)

### 3.1 Bootstrap, headers, and global middleware

| Surface | File:line | Notes |
|---|---|---|
| App entry, body parsers, listener, prefix exclusions | `server/src/main.ts` | JSON limit `MAX_JSON_SIZE` defaults to **50 MB**; URL-encoded `parameterLimit: 1_000_000`. `/jobs` and `/api/health` excluded from the global `/api` prefix. |
| CSP / CORS / Helmet config | `server/src/helpers/bootstrap.helper.ts:202-300` | CSP includes `'unsafe-inline'`, `'unsafe-eval'`, `connect-src '*'`, `frame-src '*'`, `frame-ancestors '*'`; CORS `origin: configService.get('ENABLE_CORS') === 'true' \|\| tooljetHost` — when `ENABLE_CORS=true` resolves to literal `true`, which Express `cors` reflects as the request `Origin`, combined with `credentials: true`. |
| Sentry init with PII | `server/src/helpers/bootstrap.helper.ts:initSentry` | `sendDefaultPii: true`, `tracesSampleRate: 1.0` — full payload + stack to Sentry by default if APM_VENDOR=sentry. |
| HTTPS detection for `Secure` cookie | `server/src/helpers/utils.helper.ts:588` | Cookie `secure` flag is `true` only when `TOOLJET_HOST` literally starts with `https`. Reverse-proxy terminations that leave `TOOLJET_HOST=http://...` set non-secure cookies. |
| Bull-Board admin dashboard | `server/src/modules/app/module.ts:151-156` | Mounted at `/jobs` in CE/EE (skipped on Cloud) with `express-basic-auth` user `admin` and password from `process.env.TOOLJET_QUEUE_DASH_PASSWORD`. **No default**; if env var is unset, the basic-auth users map is `{ admin: undefined }`. |
| Static assets | `server/src/main.ts:120` | `express.static(<dist>/assets)`. |
| Health endpoints (excluded from prefix) | `server/src/modules/app/controller.ts` | `/health` and `/api/health` open. |

### 3.2 Authentication / session / SSO

| Surface | File:line | Notes |
|---|---|---|
| Login / forgot password / reset | `server/src/modules/auth/controller.ts` | Routes: `POST /authenticate`, `POST /authenticate/super-admin`, `POST /authenticate/:organizationId`, `GET /authorize`, `GET /switch/:organizationId`, `POST /forgot-password`, `POST /reset-password`. |
| Auth service | `server/src/modules/auth/service.ts` | `forgotPassword` issues `uuid.v4()` and stores it **plaintext** in `user.forgotPasswordToken` (no hash, no expiry); `resetPassword` looks up by that field. |
| Login validator + retry counter | `server/src/modules/auth/util.service.ts:90-104` | `passwordRetryCount` lockout at `PASSWORD_RETRY_LIMIT` (default 5); reset on success; can be disabled with `DISABLE_PASSWORD_RETRY_LIMIT=true`. |
| JWT strategy | `server/src/modules/session/jwt/jwt.strategy.ts` | `ignoreExpiration: true`; secret = `SECRET_KEY_BASE`; token from cookie `tj_auth_token` or header `tj_auth_token` (PAT); workspace selection via `tj-workspace-id` header validated against JWT's `organizationIds[]`. |
| Cookie issuance | `server/src/modules/session/util.service.ts:106-122, 334-346` | `httpOnly: true`, `secure: isHttpsEnabled()`, `sameSite: 'strict'`, `maxAge: 2 years`. When `ENABLE_PRIVATE_APP_EMBED=true`, `sameSite` is set to `'none'`. |
| Logout | `server/src/modules/session/service.ts:37` | `response.clearCookie('tj_auth_token')` — server-side session row also deleted. |
| OAuth controller (Google/Git/OIDC/SAML/LDAP shells) | `server/src/modules/auth/oauth/controller.ts` | `POST /oauth/sign-in/:configId`, `/oauth/sign-in/common/:ssoType`. CE returns `NotImplementedException` for OpenID/SAML config endpoints; util-services exist as stubs. |
| MFA scaffolding | `server/src/modules/auth/mfa/`, `server/src/modules/auth/website/controller.ts:56-68` | TOTP stored in `user_mfa`; CE controller methods throw `NotImplementedException`. |
| SCIM provisioning | `server/src/modules/scim/guards/scim-auth.guard.ts` | Static `SCIM_BASIC_AUTH_USER/PASS` or `SCIM_HEADER_AUTH_TOKEN`. Comparisons use plain `===` (not constant-time). |
| PAT (Personal Access Token) | `server/src/modules/session/util.service.ts` (`isPatLogin`) | PATs accepted as `tj_auth_token` request header; long-lived (`PAT_EXPIRY` in days). |
| Invitation tokens | `server/src/entities/user.entity.ts:101-104`, `organization_user.entity.ts:37` | `invitationToken` and `forgotPasswordToken` stored unhashed. |

### 3.3 Authorization, tenant isolation

| Surface | File:line | Notes |
|---|---|---|
| Central feature decorator | `server/src/modules/app/decorators/init-feature.decorator.ts` + `…/constants/module-info.ts` | `MODULE_INFO[module][feature]` table maps every feature to `isPublic`, `isSuperAdminFeature`, `shouldNotSkipPublicApp`, `license`. Missing entry = guard returns false (deny). |
| Canonical guard | `server/src/modules/app/guards/ability.guard.ts:40-173` | Resolves features → public / super-admin / public-app shortcuts → otherwise calls per-module `AbilityFactory.createAbility(user, …)`. |
| Org guard (sanity check) | `server/src/modules/app/guards/organization-validate.guard.ts` | `user.organizationId === request.params.organizationId`. |
| CASL ability primitives | `server/src/modules/casl/casl-ability.factory.ts`, `server/src/modules/ability/{service,util.service}.ts` | Permission lookup always scoped to `organizationId` (util.service.ts:88-124). |
| App lookup guard | `server/src/modules/apps/guards/valid-app.guard.ts:25-29` | `findById(id, user.organizationId)` enforces tenant scope on app fetch. |
| Public-app entry | `server/src/modules/apps/guards/app-auth.guard.ts:33-54` | Slug lookup w/o org filter; sets `tj-workspace-id` from `app.organizationId`; if `app.isPublic` and feature lacks `shouldNotSkipPublicApp`, ability guard short-circuits. |
| Data-source validate guard | `server/src/modules/data-queries/guards/validate-query-source.guard.ts:31-43` | Loads data source by id **without** `organizationId` filter prior to ability check. |
| Permission OR-merge | `server/src/modules/ability/util.service.ts:190-275` | Multi-group membership = OR of capability flags (`isAllEditable ||= canEdit`). |
| Super-admin path | `server/src/modules/app/guards/ability.guard.ts:103`, `server/src/helpers/utils.helper.ts` (`isSuperAdmin`) | Super-admin enforcement uses an env/utility check, distinct from CASL `superAdmin` field which is hardcoded `false` in `ability/service.ts:64`. |

### 3.4 Data sources, query execution, code execution

| Surface | File:line | Notes |
|---|---|---|
| Query controller | `server/src/modules/data-queries/controller.ts` | All routes wrapped with `JwtAuthGuard` + `ValidateQuerySourceGuard` + ability guards. |
| Query dispatch / variable parsing | `server/src/modules/data-queries/util.service.ts:64-630` | `parseQueryOptions` walks user-supplied template `{{…}}` tokens and substitutes via regex into options passed to plugin connectors. |
| Plugin instantiation | `server/src/modules/data-sources/services/plugin-selector.service.ts` | Loads plugin packages dynamically. |
| REST API connector | `plugins/packages/restapi/lib/index.ts:154-156` | `constructUrl` = `sourceOptions.url + queryOptions.url`; `got(url, requestOptions)` at line 68. **No allow/denylist; full SSRF surface.** Cookie forwarding (`FORWARD_RESTAPI_COOKIES`) filters only `tj_auth_token`. |
| OpenAPI connector | `plugins/packages/openapi/lib/index.ts:14-21, 56` | Path params replaced unescaped (`path.replace('{x}', value)`); host taken from `sourceOptions.host` then `new URL(...)`. Path-traversal in spec params + SSRF. |
| GraphQL connector | `plugins/packages/graphql/lib/index.ts:25` | `sourceOptions.url`; query/variables forwarded as-is. |
| PostgreSQL connector | `plugins/packages/postgresql/lib/index.ts` | Raw SQL mode parameterized via `knex.raw(query, params)` when `query_params` is non-empty (line 61-75). Bulk-update mode (`buildBulkUpdateQuery`, lines ~235-256) **string-interpolates record values** — SQL injection in GUI bulk update. Same pattern in MySQL, MSSQL, OracleDB. |
| BigQuery connector | `plugins/packages/bigquery/lib/index.ts:39-77` | `CREATE VIEW`, `DELETE_RECORD`, `UPDATE_RECORD` template-interpolate `datasetId/tableId/condition`. |
| Snowflake | `plugins/packages/snowflake/lib/index.ts` | `connection.execute({ sqlText: queryOptions.query })`. |
| MongoDB | `plugins/packages/mongodb/lib/index.ts` | `parseEJSON(queryOptions.filter/update/...)` — EJSON deserialization on user input. |
| ToolJet DB / PostgREST proxy | `server/src/modules/tooljet-db/services/postgrest-proxy.service.ts:43, 216-247` | Signs HS256 JWT with `PGRST_JWT_SECRET`, role `user_<organizationId>`, `expiresIn: 1m`. URL `${tableName}` placeholders replaced from path. |
| JS execution sandbox | `server/lib/utils.ts:13-219` | `isolated-vm` isolate, `WORKFLOW_JS_MEMORY_LIMIT_MB` (default 20 MB), `WORKFLOW_JS_TIMEOUT_MS` (default 100 ms). State injected via `ivm.ExternalCopy`. `getQueryVariables` calls `resolveCode` with `wrapInIIFE: false` — top-level expression evaluation. |
| Workflow execution | `server/src/modules/workflows/processors/`, `controllers/` | CE has scheduler + executor; webhook controller methods throw `NotImplementedException` (EE-only). `ThrottlerModule` registered (workflows/module.ts:120) with `WEBHOOK_THROTTLE_LIMIT/TTL`. |
| Workflow controller authz | `server/src/modules/workflows/controllers/workflows.controller.ts:15-20` | `JwtAuthGuard + WorkflowCountGuard` only — no `FeatureAbilityGuard`. |
| AI module | `server/src/modules/ai/` (controller.ts, service.ts) | EE-gated — but routes mounted in CE namespace; CE handlers may also stub `NotImplementedException`. Worth re-examining when CE→EE bridge is exercised. |
| Email-listener | `server/src/modules/email-listener/listener.ts` | Internal event handler (`@OnEvent('emailEvent')`) — not an inbound HTTP surface. EE adds an inbound IMAP/SMTP listener (assume separate). |

### 3.5 Secrets, files, import/export, webhooks

| Surface | File:line | Notes |
|---|---|---|
| Encryption service (Lockbox replacement) | `server/src/modules/encryption/service.ts` | AES-256-GCM, random 12-byte nonce, auth tag appended; per-column key via HKDF(`LOCKBOX_MASTER_KEY`, salt=32×`'´'`, info=`<column>_ciphertext`, hash=sha384). Construction is sound; weak point is the *operational* one — `.env.example` ships `LOCKBOX_MASTER_KEY=000…0`. |
| Credentials service | `server/src/modules/encryption/services/credentials.service.ts` | Wraps encryption; stores ciphertext in `credential.value_ciphertext`. |
| Key rotation script | `server/scripts/rotate-lockbox-key.ts` | Manual; relies on `--` argument convention. |
| Files (binary blobs in DB) | `server/src/modules/files/{controller,service,repository}.ts` | Single `GET /files/:id` route. `Content-Type: image` hard-coded; `Content-Disposition: inline; filename="${file.filename}"` — filename is taken from DB without quoting/escaping. **No upload controller in CE files module** — uploads happen indirectly through app/version definitions. |
| Import/Export | `server/src/modules/import-export-resources/controller.ts`, `server/src/modules/apps/services/app-import-export.service.ts` | `POST /api/v2/resources/{export,import,clone}`. Import accepts a JSON `tooljet_version` field and a tree of apps/queries/data-sources/plugins. JWT-auth required. Imported queries are NOT auto-executed but their SQL/URLs land in the workspace as builder-trusted definitions. |
| App-Git / Git-Sync | `server/src/modules/app-git/`, `server/src/modules/git-sync/` | Provider abstractions for GitHub/GitLab/Bitbucket. Implementation uses provider HTTP APIs (no `child_process`/`simple-git` invocation found in CE). EE may add additional providers. |
| External APIs (admin) | `server/src/modules/external-apis/service.ts` | All methods `throw new Error('Method not implemented.')` in CE — the controller exposes user/workspace mutation routes that are real in EE/Cloud. |
| Outbound HTTP global agent | `server/src/helpers/bootstrap.helper.ts:setupGlobalAgent` | If `TOOLJET_HTTP_PROXY` is set, all outbound HTTP routed through `global-agent`; otherwise direct. No DNS-rebinding protection. |
| OAuth provider HTTP calls | `server/src/modules/auth/oauth/util-services/git-oauth.service.ts` | Uses `got`; reads `SSO_GIT_OAUTH2_HOST` (self-hosted GitHub Enterprise URL) from per-org config. |
| Audit logs sink | `server/src/entities/audit_log.entity.ts`, `server/src/modules/audit-logs/scheduler.ts` | Audit log entries record `resourceData` JSON — if a connector logs `sourceOptions` or `queryOptions`, credential leak risk. Search `JSON.stringify(sourceOptions)` references in plugins for confirmation in stage 2. |
| Bull-Board basic-auth queue inspection | `server/src/modules/app/module.ts:151-156` | If reachable, exposes job payloads which may contain query options / credentials. |

---

## 4. Top high-risk areas (ranked by likely exploitability × impact)

> Each item lists the primary file, the failure mode, and what stage 2 should try to demonstrate.

1. **CORS reflection + `SameSite=none` cookie under `ENABLE_PRIVATE_APP_EMBED`/`ENABLE_CORS`.**
   `server/src/helpers/bootstrap.helper.ts:222` + `server/src/modules/session/util.service.ts:115`.
   When either flag is enabled (both are documented config knobs, not exotic), the auth cookie no longer requires same-site origin and the server reflects arbitrary `Origin` with `Access-Control-Allow-Credentials: true`. End-state: any web page can issue authenticated cross-origin requests to the API.
   *Stage 2:* PoC a cross-origin authenticated POST against `/api/data-queries/:id/run` from a third-party page in a local browser.

2. **CSP almost entirely advisory.** `bootstrap.helper.ts:218-280`.
   `script-src` includes `'unsafe-inline' 'unsafe-eval'` + skypack/jsdelivr/esm.sh CDNs; `connect-src '*'`; `frame-src '*'`; `frame-ancestors '*'`. Any reflected-XSS or DOM-XSS in the app builder, public-app render path, comment rendering, or SSR will not be mitigated by CSP. The `frame-ancestors '*'` defeats the optional `DISABLE_APP_EMBED` `X-Frame-Options: DENY` (CSP wins in modern browsers).
   *Stage 2:* hunt one DOM-XSS in `frontend/src` (comments, markdown, table renderers) — CSP will not block it.

3. **SQL injection via the GUI bulk-update path on every relational connector.**
   `plugins/packages/{postgresql,mysql,mssql,oracledb}/lib/index.ts` (`buildBulkUpdateQuery`) interpolate record values straight into SQL. Any builder-role user (and any end-user reachable through a malicious app component) can drive arbitrary SQL on the connected database with whatever credentials the data-source holds.
   *Stage 2:* drive `mode: 'gui'` bulk-update with quote/value containing `';...--`.

4. **Unrestricted SSRF via REST/OpenAPI/GraphQL connectors.**
   `plugins/packages/restapi/lib/index.ts:154`, `plugins/packages/openapi/lib/index.ts:14-56`, `plugins/packages/graphql/lib/index.ts:25`.
   No allowlist, no IP/hostname denylist, no scheme restriction. Cloud deployments (AWS/GCP/Azure) can be redirected at metadata endpoints (`169.254.169.254`, `metadata.google.internal`). Coupled with `TOOLJET_HTTP_PROXY` being optional and there being no DNS-rebinding mitigation, this is the most plausible RCE-adjacent path on a self-hosted box.
   *Stage 2:* configure a REST data source pointing at `http://127.0.0.1:3000/api/...` and at `http://169.254.169.254/latest/meta-data/`.

5. **`tj-workspace-id` header switches tenant context per request.** `server/src/modules/session/jwt/jwt.strategy.ts:62-83` + `server/src/modules/data-queries/guards/validate-query-source.guard.ts:31`.
   The data-source guard fetches by id without an `organizationId` filter, then defers tenant separation to the ability check. If `MODULE_INFO` for any feature lists the data-source-related action as available to other tenants the user is a member of, cross-tenant lateral access is plausible. The asymmetry vs. apps (which *do* enforce org on lookup) is suspicious.
   *Stage 2:* attempt to fetch a known foreign data-source id while presenting a valid JWT for a different org membership and a `tj-workspace-id` for that other org.

6. **Public app authz short-circuit.** `server/src/modules/app/guards/ability.guard.ts:111-114` + `server/src/modules/apps/guards/app-auth.guard.ts:33-54`.
   Any feature whose `MODULE_INFO` entry omits `shouldNotSkipPublicApp` is fully ungated when the requested app is `isPublic`. Auditing the `MODULE_INFO` table for missing `shouldNotSkipPublicApp` flags on data-source/file/query routes is a stage-2 must-do.
   *Stage 2:* enumerate the table, then test each unflagged feature against `slug` + `tj-workspace-id` matching a public app.

7. **Password-reset token stored plaintext, no expiry.**
   `server/src/modules/auth/service.ts:238-261` and `server/src/entities/user.entity.ts:104`.
   `forgotPasswordToken` is a `uuid.v4()` written to `users.forgot_password_token` without hashing or `expires_at`. A read-only DB compromise (e.g., stolen pg_dump, log leak, debug query) yields working reset links. There is no rate limit on `/forgot-password` either.
   *Stage 2:* repeated `/forgot-password` calls; check email enumeration via timing.

8. **JWT `ignoreExpiration: true` + multi-org payload + 2-year cookie.**
   `server/src/modules/session/jwt/jwt.strategy.ts:32`, `server/src/modules/session/util.service.ts:110`.
   JWT lifetime is bounded only by the DB session row (`USER_SESSION_EXPIRY`, default 14400 minutes / 10 days), but the cookie itself can persist 2 years and the JWT carries every `organizationIds` membership. Session revocation is server-controlled; if the session table is bypassed (e.g., by a future code path that decodes JWT without the strategy), tokens are practically permanent.
   *Stage 2:* trace every JWT verification path other than `JwtStrategy` (`server/src/modules/auth/app-history-sse-auth.guard.ts`, `server/src/modules/auth/workflow-sse-auth.guard.ts`, query-auth guard, PAT path).

9. **Bull-Board admin dashboard without a default password.**
   `server/src/modules/app/module.ts:151-156`.
   In CE/EE editions, `/jobs` mounts with `express-basic-auth` user `admin` and password `process.env.TOOLJET_QUEUE_DASH_PASSWORD`. If the env var is unset, the user map becomes `{ admin: undefined }` — depending on `express-basic-auth`'s coercion, this can collapse to "any password matches" or "the literal string `undefined`". Either way it is a deploy-time landmine and the dashboard reveals workflow job payloads (which may include query options + credentials).
   *Stage 2:* run a local instance with `TOOLJET_QUEUE_DASH_PASSWORD` unset and probe `/jobs` with `admin:`, `admin:undefined`, `admin:<empty>`.

10. **REST API cookie forwarding (`FORWARD_RESTAPI_COOKIES`).**
    `plugins/packages/restapi/lib/index.ts` cookie handling forwards browser cookies (excluding `tj_auth_token`) to upstream URLs. Combined with SSRF (#4) this becomes a convenient cookie-exfiltration primitive against any internal host that accepts cookies — an attacker controls the upstream URL and reads back the request log.

11. **Connector logging may leak credentials into audit logs / Sentry.**
    `server/src/helpers/bootstrap.helper.ts:initSentry` sets `sendDefaultPii: true`; many plugins call `cleanSensitiveData`/`redactHeaders` (good), but error paths (`got` `HTTPError`) have historically leaked URLs containing secrets. Worth grepping for `console.log(sourceOptions)`/`logger.error(err)` over plugin code.

12. **MongoDB EJSON deserialization on user input.**
    `plugins/packages/mongodb/lib/index.ts` — `parseEJSON` on `queryOptions.filter/update`. EJSON itself does not execute code, but driver-side `$where`/`$function` operators have historic NoSQL-injection footprints; needs an explicit operator allowlist review.

13. **PostgREST role/JWT.**
    `server/src/modules/tooljet-db/services/postgrest-proxy.service.ts:216-247`.
    Role is `user_<organizationId>`; JWT secret is `PGRST_JWT_SECRET`. Stage 2 should verify (a) that PostgREST `db-pre-config` actually creates and revokes roles per org, (b) that the URL placeholder replacement (`${tableName}`) cannot escape into a PostgREST action.

14. **Unhashed invitation tokens; `accept-invite` flow under `isInviteSession`.**
    `server/src/modules/auth/service.ts` (invite branches) + `jwt.strategy.ts:54`. The invite session bypasses some org-membership validation. Worth verifying that holding *any* valid invite cannot escalate to an org the inviter does not own.

---

## 5. Scanner / tooling plan for stages 2–N

Run all locally against the clone; do not point at any non-local host.

**Static / SAST**
- `semgrep` with rulesets `p/owasp-top-ten`, `p/typescript`, `p/nodejsscan`, `p/javascript`, plus a custom rule set for: `res.cookie('tj_auth_token', …)` flag drift; `got(`…`)` calls without URL allowlist; `knex.raw('${`…; `JSON.parse(req.body…`; `fs.createReadStream(req.params…`.
- `eslint` with `eslint-plugin-security` over `server/src/`, `plugins/packages/*/lib/`, `frontend/src/`.
- `gitleaks detect` to confirm no committed secrets (the existing repo has `LOCKBOX_MASTER_KEY=0…0` only in `.env.example`).
- `tsc --noEmit` on `server/` after generating the strictest tsconfig — type holes around `request.user.organizationId` are common authz bugs.

**Dependency / supply chain**
- `npm audit --omit=dev` in `server/`, `plugins/`, `frontend/`. Capture all `high`/`critical` and triage any reachable in CE.
- `osv-scanner -r .` for the same plus transitive coverage that `npm audit` misses.
- `syft packages dir:.` → `grype` (note: the maintainers just removed Grype from CI in commit `f27dc5da4`; do not regress that workflow, just run locally).
- Inspect lockfiles for unexpected scoped registries / `git+https` / `file:` deps.

**Dynamic / DAST (local-only)**
- Stand up via `docker-compose up` with `.env.example` (override `LOCKBOX_MASTER_KEY`, `SECRET_KEY_BASE`, `TOOLJET_QUEUE_DASH_PASSWORD`).
- `zap-baseline.py -t http://localhost:8082` for unauthenticated baseline.
- Authenticated runs: scripted login → exercise `/api/apps`, `/api/data-queries`, `/api/data-sources`, `/api/files`, `/api/v2/resources/import` with both builder and end-user JWTs, then with a foreign `tj-workspace-id`.
- Targeted PoCs for the items in §4 (CORS reflection, SSRF, bulk-update SQLi, public-app bypass, bull-board basic-auth).
- Burp/Caido active scans focused on auth, query, and import endpoints.

**Custom probes**
- Script that decodes a captured `tj_auth_token` and tries every other organization in the issuer's `organizationIds`.
- Script that walks `MODULE_INFO` and prints features missing `shouldNotSkipPublicApp`, then attempts each route against a pre-seeded public app.
- Sandbox-escape probe inside `server/lib/utils.ts:resolveCode` — try `process`, `globalThis`, `Function('return this')()`, prototype pollution into the injected state.
- SAML signature wrapping / OIDC `nonce` reuse harness (need EE source; skip in CE-only audit).

**Build / CI hygiene**
- Re-run `.github/workflows/codeql.yml` (recently updated in `c3b85c0c5`) and capture results.
- Inspect `.github/workflows/*` for any pre-existing security workflow we should not regress.

---

## 6. Assumptions, gaps, and out-of-scope

- **`server/ee/` is empty in this clone.** Findings about workflows webhooks, instance settings, MFA, SAML/OIDC/LDAP, AI assistant, white-labelling, and external-apis admin are inferred from CE shells (NotImplementedException stubs). EE source must be brought in to assess: SAML signature handling, OIDC PKCE, MFA secret protection, the AI feature's tool-calling sandbox, and the actual webhook trigger code paths.
- **Frontend XSS is deferred** to a stage-2 review (comments, markdown, custom-component renderer, code editor). Worth combining with the CSP weakness in §4.2.
- **Marketplace plugins** (`marketplace/`) are out of scope — they are user-installable third-party code by definition.
- **Helm/Terraform deploy defaults** (`deploy/helm/`, `terraform/`) are partly walked; a deeper review of default ingress, secret references, and exposed services should accompany stage 2.
- **Cypress fixtures** under `cypress-tests/` may inadvertently include hard-coded secrets — a quick `gitleaks` over that tree is warranted before publishing the audit.
- **Email-listener inbound** in CE is purely an in-process event handler; the IMAP/SMTP-listener service is EE.
- **Local repro caveat.** Some of the high-risk paths (ENABLE_CORS, ENABLE_PRIVATE_APP_EMBED, missing `TOOLJET_QUEUE_DASH_PASSWORD`) are configuration-conditional. Stage 2 must explicitly enumerate the exploitability matrix per supported deployment guide rather than only the most-secure default.
- **No production probing.** All dynamic testing must remain local — `tooljet.com`, demo instances, and customer environments are explicitly off-limits.

---

*This file is the map for stages 2+. Each row in the §3 tables is intended to be revisited with a concrete PoC or "no issue" annotation. Entries in §4 are the priority list for the next pass.*
