# Security Finding Validation

Scope: local static analysis of this cloned repository only. I did not probe ToolJet production, customer instances, cloud metadata services, GitHub, npm, AWS, or other third-party services.

Validation basis: source review, lockfile inspection, local grep/Node checks, and local reasoning over guard/controller/service call chains.

## Summary Counts

| Final status | Count |
|---|---:|
| Confirmed | 29 |
| Likely | 40 |
| Unlikely | 22 |
| False Positive | 16 |
| **Total candidates** | **107** |

## Validation Table

| ID | Source | Title | Original severity | Final status | Confidence | Notes |
|---|---|---|---|---|---|---|
| DEP-S1 | DEP_AUDIT | `simple-git` RCE advisory | Critical | False Positive | High | Package is present, but no CE import/callsite was found in `server/src`, `server/lib`, or plugins. |
| DEP-S2 | DEP_AUDIT | `protobufjs` arbitrary code execution | Critical | Unlikely | High | `protobuf.parse()` is reachable, but CE parses `../protos/service.proto` from disk, not request/UI supplied proto text. |
| DEP-S3 | DEP_AUDIT | `handlebars` AST/code injection | Critical | Unlikely | Medium | Templates are server-controlled `.hbs` files; attacker controls template data, not template source. |
| DEP-S4 | DEP_AUDIT | `multer` upload DoS advisories | High | Likely | Medium | Multipart upload endpoints use `FileInterceptor`; advisory exploitability depends exact `multer` parser behavior. |
| DEP-S5 | DEP_AUDIT | `nodemailer` address parser DoS | High | Likely | Medium | User-controlled email strings reach `sendMail()` through forgot-password/invite flows. |
| DEP-S6 | DEP_AUDIT | `path-to-regexp` ReDoS in Nest routes | High | Likely | Medium | Vulnerable versions are present under Nest; parameterized routes are exposed broadly. |
| DEP-S7 | DEP_AUDIT | `undici` WebSocket/parser issues | High | Unlikely | Medium | No direct `undici` WebSocket callsite in CE; outbound HTTP uses `got` or fixed-host `fetch()` paths. |
| DEP-S8 | DEP_AUDIT | `bcrypt`/`node-pre-gyp` install-time chain | High | Likely | Medium | Runtime is not affected, but self-hosted production builds that run `npm install` inherit supply-chain exposure. |
| DEP-S9 | DEP_AUDIT | `node-forge` PKI/SAML advisories | High | False Positive | High | CE SAML endpoints throw `NotFoundException`/are not implemented; no reachable PKI verification sink found. |
| DEP-S10 | DEP_AUDIT | `systeminformation` command injection via OTel host metrics | High | Likely | Medium | `ENABLE_OTEL=true` enables `nestjs-otel` host metrics while an override pins vulnerable `systeminformation`. |
| DEP-S11 | DEP_AUDIT | `dompurify` XSS bypass advisories | High | Likely | Medium | DOMPurify is heavily used on user-rendered HTML; bypass impact is amplified by permissive CSP. |
| DEP-S12 | DEP_AUDIT | Browser `axios` SSRF/DoS | High | Unlikely | Medium | Frontend axios is browser-sandboxed; no user-built config merge sink was confirmed. |
| DEP-S13 | DEP_AUDIT | `jspdf`/`jspdf-autotable` injection | High | Likely | Medium | PDF export renders app/query/table data through vulnerable frontend libraries. |
| DEP-S14 | DEP_AUDIT | `draft-js`/`immutable` prototype pollution | High | Likely | Medium | Draft editor dependencies are present and used; exact exploit chain needs browser PoC. |
| DEP-S15 | DEP_AUDIT | Server-side plugin `axios` SSRF/metadata exfil | High | Likely | Medium | Original plugins-workspace claim is overbroad, but marketplace `harperdb` imports vulnerable axios server-side. |
| DEP-S16 | DEP_AUDIT | `@nestjs/microservices` JsonSocket DoS | High | False Positive | High | Package is installed, but no `createMicroservice`, TCP transport, or listener was found. |
| DEP-S17 | DEP_AUDIT | Direct `fast-xml-parser` critical advisory | High | False Positive | High | Direct server dependency has no CE import; AWS transitive chain is tracked separately. |
| DEP-S18 | DEP_AUDIT | `@xmldom/xmldom` SAML/XML advisories | High | False Positive | High | Only relevant to SAML; CE SAML paths are not implemented. |
| DEP-S19 | DEP_AUDIT | `i18next-http-backend` lng/ns traversal | Moderate | Unlikely | High | `lng` comes from server config and `loadPath` is fixed; no URL-controlled language/namespace path found. |
| DEP-S20 | DEP_AUDIT | `@nestjs/core` injection advisory | Moderate | Likely | Low | Vulnerable Nest core is runtime-reachable; advisory details are broad, so exploitability remains dependency-level. |
| DEP-AWS | DEP_AUDIT | AWS SDK XML builder / `fast-xml-parser` chain | High | Likely | Medium | AWS SDK packages are vulnerable; ToolJet passes user-controlled recipients, keys, subjects, and plugin options into SDK calls. |
| DEP-H1 | DEP_AUDIT | Deprecated/EOL dependency set | Hygiene | Likely | Medium | Confirmed lockfile hygiene risk, not a single directly exploitable app bug. |
| DEP-H2 | DEP_AUDIT | Install lifecycle scripts | Hygiene | Unlikely | Medium | Reviewed as expected native/build scripts; no malicious local package source found. |
| A1 | SAST | SCIM auth bypass when token env is unset | P0 | Confirmed | High | `Authorization: Bearer` yields `token === undefined`; if SCIM is enabled and token unset, guard returns true. |
| A2 | SAST | Cross-tenant data-source lookup via `dataSourceId` | P1 | Likely | High | `findById(dataSourceId)` lacks org scope; ability can grant all usable data sources in current org. Covered by M1. |
| A3 | SAST | Public app slug lookup stamps workspace header | P1 | Likely | High | Slug lookup is global and rewrites `tj-workspace-id`; exploit depends downstream public-app route. Covered by M6. |
| A4 | SAST | Public-app ability short-circuit | P1 | Likely | High | Short-circuit exists; current anonymous reachability is limited to routes using AppAuth/PublicApp guards. Covered by M5. |
| A5 | SAST | Forgot-password token plaintext/no expiry/no rate limit | P1 | Confirmed | High | Tokens are UUIDs stored plaintext with no expiry column/check; route has no local throttle. Covered by M9. |
| A6 | SAST | `ignoreExpiration: true` JWT strategy | P1 | Unlikely | High | DB session expiry is enforced in `validateUserSession()` on JWT-guarded paths; no bypassing guard found. |
| A7 | SAST | Workflow token timing attack | P2 | Unlikely | Medium | Non-constant comparison exists, but remote token recovery via timing is not credible without stronger oracle. M7 covers replay/no-HMAC risk. |
| A8 | SAST | Workflow lookup by name without org filter | P2 | Unlikely | Medium | Name lookup is cross-org, but execution still requires a valid bearer token; timing chain is weak. |
| A9 | SAST | Invite redirect login skips password | P1 | Confirmed | High | `redirectTo` selects invite branch and `findByEmail()` runs without password verification for invited users. |
| A10 | SAST | Public onboarding guards misconfiguration | P2 | Unlikely | High | Guards explicitly gate first user by user count and signup by `DISABLE_SIGNUPS`; no bypass found. |
| I1 | SAST | SQL GUI bulk update interpolation | P0 | Confirmed | High | Table, column, key, and values are string-concatenated in SQL across SQL plugins. |
| I2 | SAST | Raw SQL mode plus text template substitution | P1 | Likely | Medium | Raw SQL is intentional for builders, but end-user template values can become SQL text if query author uses no params. |
| I3 | SAST | BigQuery SQL interpolation | P1 | Confirmed | High | Dataset/table/view/condition fields are concatenated into BigQuery SQL. |
| I4 | SAST | MongoDB EJSON operator injection | P1 | Likely | Medium | User-controlled JSON5/EJSON flows to Mongo driver filters/pipelines; JS operators depend MongoDB server config/version. |
| I5 | SAST | `eval()` of rotated audit log | P0 | Unlikely | Medium | `eval()` is real but request-controlled strings are formatted by `util.inspect`; no practical remote break-out found. |
| I6 | SAST | Server-side template substitution primitive | P1 | Likely | High | Raw textual replacement is confirmed; exploitability depends connector sink. |
| I7 | SAST | OpenAPI path replacement and host override | P1 | Confirmed | High | Path params are not URL-encoded; query host can be used when source host is unset. |
| I8 | SAST | SAP HANA raw SQL execution | P2 | Likely | Medium | Raw query text reaches `connection.exec()`; same app-author/end-user template caveat as I2. |
| I9 | SAST | Dynamic SQL connection target override | P1 | Confirmed | High | When enabled, query options rewrite DB host/database before connecting with stored credentials. |
| I10 | SAST | MongoDB URI host/port injection | P1 | Confirmed | High | Host/port/query params are concatenated without URL encoding in URI construction. |
| S1 | SAST | REST connector SSRF | P0 | Confirmed | High | `sourceOptions.url + queryOptions.url` flows directly to `got()`, no host/IP allowlist. |
| S2 | SAST | OpenAPI connector SSRF | P0 | Confirmed | High | Resolved host/path flows directly to `got()`, no host/IP allowlist. |
| S3 | SAST | GraphQL connector SSRF | P0 | Confirmed | High | `sourceOptions.url` flows directly to `got()`, no host/IP allowlist. |
| S4 | SAST | InfluxDB/CouchDB connector SSRF | P1 | Confirmed | High | Protocol/host/port are user-configured and concatenated into `got()` URLs. |
| S5 | SAST | n8n/Baserow/Zendesk SSRF variants | P2 | Likely | Medium | n8n confirmed; others follow same connector pattern but were not fully re-walked. |
| S6 | SAST | gRPC remote proto URL SSRF/temp-file race | P1 | Confirmed | High | User-controlled proto URL is fetched with `got()` and written to predictable tmp filename. |
| S7 | SAST | Forward browser cookies to REST upstream | P1 | Likely | High | Env-gated by `FORWARD_RESTAPI_COOKIES`; filter excludes only exact `tj_auth_token=` prefix. |
| S8 | SAST | Upstream Set-Cookie forwarded to client | P0 | Confirmed | High | Every upstream cookie name is passed to `response.cookie()` with no reserved-name filter. Covered by M14. |
| S9 | SAST | Missing global HTTP proxy choke point | P2 | Unlikely | Medium | This is an absent mitigation, not a standalone vulnerability. |
| S10 | SAST | Git OAuth host configurable per org | P2 | Likely | High | Workspace admin can configure `hostName`; OAuth code/token/userinfo calls use it. Covered by M8. |
| K1 | SAST | TJDB password seed bytes logged | P0 | False Positive | High | The logged `crypto.randomBytes()` call is not the bytes used for the generated password. |
| K2 | SAST | License terms logged at startup | P3 | Likely | Medium | Startup logs contain license terms; impact depends deployment log access/content. |
| K3 | SAST | Sentry `sendDefaultPii` and full tracing | P1 | Confirmed | High | `sendDefaultPii: true`, `tracesSampleRate: 1.0`, and request body span attributes are present. |
| K4 | SAST | REST error body logged | P1 | Confirmed | High | Full upstream error body is logged on REST HTTP errors. |
| K5 | SAST | OpenAPI full error object logged | P2 | Likely | Medium | `console.log(error)` logs `got` error object; header exposure depends runtime object serialization. |
| K6 | SAST | File response header injection/MIME confusion | P1 | Unlikely | Medium | Filename is unescaped, but Node rejects CRLF header values and Helmet sets `nosniff`; F1/M19 cover IDOR. |
| K7 | SAST | Lockbox key unset/default hazard | P1 | Likely | Medium | Unset key throws, but `.env.example` ships a valid all-zero key that would decrypt copied-default deployments. |
| K8 | SAST | Valid placeholder secrets in `.env.example` | P2 | Likely | Medium | Confirmed valid-looking defaults/placeholders; exploitability is deployment hygiene. |
| K9 | SAST | Hard-coded test credentials | P3 | False Positive | High | Test-only path under `__tests__`. |
| F1 | SAST | File read by UUID without org scope | P2 | Confirmed | High | Authenticated users can fetch any file row if UUID is known; repository uses only `{ id }`. |
| F2 | SAST | gRPC filesystem proto directory only warns | P1 | Confirmed | High | Outside project/home paths trigger `console.warn()` but are still returned and scanned. |
| F3 | SAST | Log path join traversal | P3 | False Positive | High | Operator-controlled log path, not request-controlled. |
| F4 | SAST | Import can install malicious plugin | P2 | False Positive | High | Import rejects marketplace plugin datasources unless plugin already exists; it does not install arbitrary plugins. |
| X1 | SAST | New table HTML/String XSS | P0 | Likely | High | HTML column is sanitized, but editable `StringColumn` uses raw `dangerouslySetInnerHTML`. |
| X2 | SAST | Custom CSS `style.innerHTML` script escape | P1 | False Positive | Medium | Assigning `innerHTML` on a `style` element does not create sibling script nodes; this is CSS injection by privileged style authors. |
| X3 | SAST | Misc unsanitized `dangerouslySetInnerHTML` | P1 | Likely | Medium | Text/Draft paths sanitize; table highlighted-cell path inserts unsanitized `htmlElement`. |
| X4 | SAST | Comment mention HTML injection | P0 | Confirmed | High | Stored comment text is string-replaced and rendered without escaping/sanitization. |
| X5 | SAST | `helpText` prop XSS | P1 | False Positive | Medium | Observed callsites pass static/i18n datasource help text, not builder/end-user controlled HTML. |
| X6 | SAST | SVG/HTML widgets with DOMPurify | P2 | Unlikely | Medium | Paths call DOMPurify; no unsafe SVG profile override was confirmed. Dependency bypass risk is DEP-S11. |
| C1 | SAST | CORS reflection with credentials | P0 | Confirmed | High | `ENABLE_CORS=true` sets `origin: true` with `credentials: true`. |
| C2 | SAST | `SameSite=None` under private app embed | P0 | Confirmed | High | Login and switch-workspace cookies use `sameSite='none'` when `ENABLE_PRIVATE_APP_EMBED=true`. |
| C3 | SAST | Permissive CSP | P1 | Confirmed | High | CSP includes `unsafe-inline`, `unsafe-eval`, wildcard connect/frame directives. |
| C4 | SAST | Cookie `secure` based on `TOOLJET_HOST` | P2 | Likely | Medium | `secure` is false unless `TOOLJET_HOST` starts with `https`; proxy deployments can misconfigure it. |
| C5 | SAST | `Math.random()` in TJDB password chars | P2 | Unlikely | Medium | Four chars use `Math.random()`, but remaining 26 chars are cryptographically random and not logged. |
| C6 | SAST | Random transaction ID | P3 | False Positive | High | Log correlation ID only. |
| C7 | SAST | HKDF salt/info operational concern | P3 | False Positive | Medium | No security flaw confirmed; compatibility risk only. |
| C8 | SAST | PostgREST JWT secret placeholder | P2 | Likely | Medium | HS256 signing is sound, but empty/default `PGRST_JWT_SECRET` is a deployment-critical secret issue. |
| C9 | SAST | SCIM timing comparison | P2 | Unlikely | Medium | Timing leak is secondary; A1 covers real SCIM bypass. |
| C10 | SAST | Queue dashboard empty/undefined password | P1 | Likely | Medium | `/jobs` basic auth is configured from `TOOLJET_QUEUE_DASH_PASSWORD`; empty/missing value is a deployment landmine. |
| R1 | SAST | Large unauthenticated/request bodies | P1 | Likely | Medium | 50 MB JSON and 1,000,000 URL parameter limit confirmed; DoS depends traffic budget. |
| R2 | SAST | Import/export regex ReDoS | P2 | Unlikely | Medium | Regexes are imperfect but no catastrophic nested quantifier path was confirmed. |
| R3 | SAST | Constants/secrets regex misparse | P1 | Likely | High | Regex precedence is wrong and can trigger broader constant resolution than intended. |
| R4 | SAST | Lockbox rotation regex DoS | P3 | False Positive | High | Operator-only scripts with fixed hex-key validation. |
| R5 | SAST | `isolated-vm` top-level evaluation | P2 | Unlikely | Medium | Runtime limits exist; current callers do not pass host `require`. M3/M4 cover latent issues. |
| M1 | CODE_REVIEW | Cross-tenant data-source action | P0 | Likely | High | Same as A2 with clearer `isAllUsable` precondition. |
| M2 | CODE_REVIEW | Marketplace plugin install to host RCE | P0 | Confirmed | High | Builder/admin can install repo plugin; loaded code receives host `require` and `process`. |
| M3 | CODE_REVIEW | `resolveCode` exposes `require` if state contains it | P0 | Unlikely | High | Dangerous branch exists, but no current server caller passes `require` in state/custom objects. |
| M4 | CODE_REVIEW | `global.derefInto()` state persistence | P1 | Unlikely | Medium | Shared context persistence is plausible but only within author-controlled workflow execution. |
| M5 | CODE_REVIEW | Public-app authorization short-circuit | P0 | Likely | High | Short-circuit exists; current exposure depends which controllers use public app guards. |
| M6 | CODE_REVIEW | Public-app guard stamps workspace from slug | P1 | Likely | High | Global slug lookup and workspace header mutation are confirmed. |
| M7 | CODE_REVIEW | Workflow webhook no HMAC/replay protection | P1 | Likely | High | Bearer token equality and no nonce/timestamp are confirmed; timing brute force remains unlikely. |
| M8 | CODE_REVIEW | OAuth no state binding and configurable Git host | P1 | Likely | High | State is accepted but not validated; Git host is used for token/userinfo calls. |
| M9 | CODE_REVIEW | Reset/invite tokens plaintext/no expiry/no rate limit | P1 | Confirmed | High | Same as A5 plus plaintext invite token storage and accept flow. |
| M10 | CODE_REVIEW | Folder update without org scope | P1 | Confirmed | High | Update WHERE clause uses folder ID only; delete path shows intended org scoping. |
| M11 | CODE_REVIEW | Editor can toggle app public/slug | P1 | Confirmed | High | Editable-app permission grants `APP_PUBLIC_UPDATE`; update endpoint accepts `is_public`/`slug`. |
| M12 | CODE_REVIEW | `allowRoleChange` bulk promotion | P2 | Unlikely | Medium | Admin-gated and explicit flag; looks like intended admin behavior, though audit UX could improve. |
| M13 | CODE_REVIEW | Anonymous public app to plugin RCE chain | P0 | False Positive | High | `plugins` controller is guarded by `JwtAuthGuard`; public-app shortcut is not reached. |
| M14 | CODE_REVIEW | REST upstream Set-Cookie session fixation | P0 | Confirmed | High | Same sink as S8; reserved cookie names are not filtered. |
| M15 | CODE_REVIEW | Cookie forward filter misses future variants | P1 | Unlikely | Medium | Current only sensitive cookie is `tj_auth_token`; future-cookie concern is valid but latent. |
| M16 | CODE_REVIEW | `sso_user_info` leaks Git access token | P1 | False Positive | High | Git service builds `userinfoResponse`, but no current CE code stores it in `user_details.sso_user_info`. |
| M17 | CODE_REVIEW | Workflow API token plaintext | P1 | Confirmed | High | `apps.workflow_api_token` is a plain column and compared directly. |
| M18 | CODE_REVIEW | Data-source update audit metadata leaks credentials | P1 | Confirmed | High | `metadata: updateDataSourceDto` is set before/alongside encryption storage. |
| M19 | CODE_REVIEW | File serve response splitting/MIME/no org filter | P1 | Likely | Medium | No-org file read is confirmed; response splitting/XSS impact is mitigated by Node/Helmet. |
| M20 | CODE_REVIEW | Invite acceptance after inviter demotion | P2 | Likely | Medium | Accept flow activates existing invite role without revalidating inviter's current authority. |

## Detailed Validation: Confirmed And Likely

### Auth And Tenant Boundary

**SCIM auth bypass (A1).** Entry is any SCIM route protected by `server/src/modules/scim/guards/scim-auth.guard.ts`. The attacker-controlled input is the `Authorization` header. With `SCIM_ENABLED=true` and `SCIM_HEADER_AUTH_TOKEN` unset, `Authorization: Bearer` produces `authHeader.split(' ')[1] === undefined`, which equals the unset config value. Auth context is unauthenticated. Mitigations are missing: no required-secret startup validation and no constant-time comparison. Local reproduction is static: inspect lines 17-39 of the guard. Fix direction: require exactly one configured SCIM auth method when SCIM is enabled, reject missing/empty configured secrets, parse bearer syntax strictly, and compare with `crypto.timingSafeEqual`.

**Cross-tenant data source use (A2, M1).** Entry points include `POST /api/data-queries/data-sources/:dataSourceId/versions/:versionId` and `GET /api/data-queries/:dataSourceId/list-tables/:environmentId`. `ValidateQuerySourceGuard` calls `dataSourceRepository.findById(dataSourceId)` without `organizationId`; `DataSourceFeatureAbilityFactory` then grants broad actions when the current workspace permission has `isAllUsable`. The attacker is an authenticated builder/member who can guess or obtain a foreign data source UUID. Mitigations are incomplete because permission loading is scoped to the request workspace, not the fetched data source's workspace. Local reproduction is static across `server/src/modules/data-queries/guards/validate-query-source.guard.ts`, `server/src/modules/data-sources/repository.ts`, and `server/src/modules/data-queries/ability/data-source/index.ts`. Fix direction: require `organizationId` in `findById` for guarded paths and reject when `dataSource.organizationId !== user.organizationId`.

**Public-app trust boundary (A3, A4, M5, M6).** `AppAuthGuard` and `PublicAppEnvironmentGuard` look up app slugs globally and stamp `request.headers['tj-workspace-id'] = app.organizationId`. `AbilityGuard` returns true for public apps unless a feature opts into `shouldNotSkipPublicApp`. Auth context is anonymous for public app routes and authenticated foreign-workspace user for mixed paths. Current confirmed anonymous surfaces include public app data-query run, public constants, released-app access, and default environment lookups; many other controllers still have `JwtAuthGuard`, so the original "all features" claim was overbroad. Fix direction: make public access allowlist-based per route, never mutate `tj-workspace-id` from a slug without also setting a non-user public context, and require every public route to perform resource-specific org checks.

**Password reset, invite, and invite login (A5, A9, M9, M20).** `/forgot-password` accepts unauthenticated email input and stores `uuid.v4()` in `users.forgot_password_token` with no expiry. `resetPassword()` looks up by plaintext token only. Invite tokens are also plaintext and accepted later without revalidating the inviter's current authority. Separately, `AuthService.login()` treats attacker-controlled `redirectTo` beginning with `/organization-invitations/` or `/invitations/` as an invite flow and fetches invited users without password verification. Local reproduction is static in `server/src/modules/auth/service.ts` and `server/src/modules/onboarding/service.ts`. Fix direction: hash reset/invite/workflow tokens at rest, add expiry and rate limits, require password or signed invite-session proof for invite login, and re-check inviter/current role at invite redemption.

**OAuth and SSO host control (S10, M8).** `OauthService.signIn()` accepts `state` in `SSOResponse` but does not validate it against a server-stored nonce. For Git SSO, `GitOAuthService` builds token and userinfo URLs from `configs.hostName`, which workspace admins can configure through login settings. Auth context is unauthenticated callback plus workspace admin for malicious configuration. Fix direction: store and verify OAuth state/PKCE binding, restrict custom Git hosts to explicit admin allowlists, and never trust userinfo from arbitrary hosts unless the host is workspace-owner controlled and clearly documented.

**Workflow webhooks (M7, M17).** Workflow trigger auth uses bearer-token equality against `apps.workflow_api_token`, and the token is stored plaintext. There is no timestamp, nonce, HMAC, or replay cache. Auth context is unauthenticated external caller with token knowledge. Timing brute force is unlikely, but replay after capture and DB-read-to-trigger are real. Fix direction: store token hashes, compare hashes with `timingSafeEqual`, support rotation, and add optional HMAC timestamp/nonce replay protection.

**Folder and app publication authorization (M10, M11).** `FoldersService.updateFolder()` updates by `{ id }` only while delete uses `{ id, organizationId }`; any authenticated user with folder update permission and a foreign UUID can rename a foreign folder. App ability grants `APP_PUBLIC_UPDATE` to users who can edit an app, and the same update service accepts `slug`. Fix direction: add organization predicates to folder updates and split app publishing/slug changes into separate admin-controlled capabilities.

### Injection And Code Execution

**SQL and query construction (I1, I2, I3, I4, I6, I8).** Attacker-controlled query options flow from app data-query execution and builder-configured queries through `parseQueryOptionsInternal()` into connector sinks. Confirmed unsafe sinks include SQL plugin bulk-update query builders, BigQuery view/update/delete SQL construction, SAP HANA `connection.exec(query)`, and raw SQL modes when authors do not use parameter arrays. Auth context is builder for authoring; end users or anonymous public-app users can become attackers when unsafe template variables are exposed in a published app. Fix direction: use connector-native parameterization for GUI modes, quote identifiers with driver helpers, make raw SQL variable interpolation opt-in with warnings, and reject unsafe string interpolation in GUI builders.

**OpenAPI and database connection target rewriting (I7, I9, I10).** OpenAPI path params are literal replacements without URL encoding, and query host can be used when the source host is unset. SQL dynamic connection parameters can rewrite host/database before connecting with stored credentials. MongoDB URI construction URL-encodes username/password but not host/port/query params. Auth context is builder or public app user when these options are templated. Fix direction: URL-encode path segments, remove query-time host override or gate it separately, validate DB hosts against an allowlist, and construct Mongo URLs with structured URL APIs.

**Marketplace plugin RCE (M2).** `POST /api/plugins/install` is authenticated, but the plugin ability grants install to admins and builders. If `repo` is supplied, `PluginsUtilService.fetchPluginFilesFromRepo()` downloads release assets; later `PluginsServiceSelector.findMarketplacePluginService()` executes the stored JS with `vm.runInNewContext()` while exposing host `require`, `process`, `global`, `Buffer`, timers, and fetch. Auth context is authenticated builder/admin, not anonymous. Fix direction: remove arbitrary repo install in production, verify signed marketplace packages, run plugins out-of-process with a narrow RPC boundary, and never expose host `require`/`process` to plugin code.

**Audit credential leak (M18).** `DataSourcesService.update()` sets audit-log metadata to the whole `updateDataSourceDto`; datasource option encryption happens in the datasource update path, but audit metadata preserves the plaintext request DTO. Auth context is any user allowed to update a datasource; impact is credential disclosure to DB/audit-log readers. Fix direction: redact encrypted/sensitive option keys before setting request-context audit metadata and add regression tests for datasource password updates.

**Resource exhaustion and regex/constant resolution (R1, R3).** Body parser defaults allow 50 MB JSON and a 1,000,000 URL-encoded parameter limit. The constants/secrets matcher in `DataSourcesUtilService` is `/{{constants|secrets|globals.server\..+?}}/g`, so alternation precedence is wrong and can match more broadly than intended. Auth context varies; several public or unauthenticated endpoints still parse large bodies. Fix direction: reduce global limits, add endpoint-specific limits, add throttling to public auth/import routes, and replace the matcher with `/{{(?:constants|secrets|globals\\.server)\\.[^}]+}}/g`.

### SSRF And Cookie Handling

**Outbound connector SSRF (S1-S6).** REST, OpenAPI, GraphQL, InfluxDB, CouchDB, n8n, and gRPC proto URL paths build URLs from datasource/query options and pass them to `got()` without scheme, host, IP-range, or DNS-rebinding controls. Auth context is builder for configuration; anonymous public-app users can trigger existing published queries. Local reproduction is static in `plugins/packages/*/lib/index.ts` and `plugins/packages/grpcv2/lib/operations.ts`. Fix direction: centralize outbound HTTP, allow only `http`/`https`, block loopback/link-local/private ranges by resolved IP, pin DNS per request, and add per-connector allowlists.

**Cookie forwarding/session fixation (S7, S8, M14).** When `FORWARD_RESTAPI_COOKIES=true`, client cookies are forwarded to REST upstreams except exact `tj_auth_token=`. Conversely, `setCookiesBackToClient()` forwards every upstream `Set-Cookie` name through Express `response.cookie()`, allowing an attacker-controlled upstream to set `tj_auth_token` for the ToolJet origin. Auth context is a user running a malicious REST query or anonymous visitor to a malicious public app. Fix direction: never forward browser cookies to arbitrary datasource hosts by default; block all ToolJet-reserved cookie names on inbound and outbound paths; only forward cookies for explicitly trusted same-site hosts.

### Frontend XSS And Browser-Side Findings

**Comment XSS (X4).** Comment bodies are stored user input. `hightlightMentionedUserInComment()` string-replaces mention syntax and returns unsanitized HTML that is rendered via `dangerouslySetInnerHTML` in editor comments, comment notifications, and notification center. Auth context is same-workspace user who can comment; impact is stored XSS in other users' browsers. Fix direction: sanitize after mention highlighting or build React nodes instead of HTML strings.

**Table rendering XSS (X1, X3).** The original HTML-column claim was partly wrong: `HTML.jsx` sanitizes with DOMPurify. Remaining likely sinks are editable `StringColumn`, which injects `cellValue` directly, and old table highlighted-cell rendering, where `htmlElement` is inserted unsanitized after adding `<mark>` tags. Data comes from datasource query results or editable table values. Fix direction: sanitize every `dangerouslySetInnerHTML` value after all transformations, and prefer text nodes for string columns.

**Frontend dependency XSS/PDF risks (DEP-S11, DEP-S13, DEP-S14).** DOMPurify, jsPDF/autotable, and Draft.js/immutable vulnerable versions are present and used in user-rendered app surfaces. These remain dependency-level likely findings because exploitability depends browser-specific payloads. Fix direction: bump DOMPurify, schedule jsPDF/autotable major upgrade with export tests, and replace or isolate Draft.js/immutable.

**Permissive CSP (C3).** The CSP permits inline script, eval, wildcard connect, and wildcard frames. This does not create XSS by itself, but removes defense-in-depth for X4/table/dependency bypasses. Fix direction: remove `unsafe-inline`/`unsafe-eval`, add nonces/hashes where necessary, narrow `connect-src`, and set `frame-ancestors` from explicit embed settings.

### Crypto, Session, And Deployment Configuration

**CORS/CSRF combination (C1, C2).** `ENABLE_CORS=true` reflects any origin while allowing credentials. `ENABLE_PRIVATE_APP_EMBED=true` sets auth cookies to `SameSite=None; Secure`. With no CSRF token layer found, any hostile origin can send credentialed requests in this deployment mode. Fix direction: replace reflected CORS with an allowlist and add CSRF tokens or origin checks for state-changing cookie-authenticated requests.

**Cookie secure flag (C4).** `isHttpsEnabled()` only checks `TOOLJET_HOST.startsWith('https')`. Behind a TLS-terminating proxy, a mis-set `TOOLJET_HOST` can issue non-secure auth cookies. Fix direction: support explicit `COOKIE_SECURE=true` and trusted proxy settings independent of public URL string parsing.

**Deployment secrets (K7, K8, C8, C10).** `.env.example` includes a valid all-zero `LOCKBOX_MASTER_KEY`; `PGRST_JWT_SECRET` is empty in the example; Bull Board auth uses `TOOLJET_QUEUE_DASH_PASSWORD` directly. These are self-hosted operator risks rather than request-path vulnerabilities. Fix direction: fail startup on missing/default secrets, generate install-time secrets, and disable `/jobs` unless a strong password is configured.

**Sentry and logs (K2, K3, K4, K5).** Sentry is initialized with `sendDefaultPii: true` and full tracing; custom OTel spans include request bodies. REST/OpenAPI error handlers log upstream bodies or full error objects. Auth context varies; attacker influence comes through causing errors or submitting request bodies. Fix direction: default PII off, redact request bodies and upstream error bodies, and log structured redacted metadata only.

### Files, Local Filesystem, And Import

**File UUID IDOR (F1, M19).** `FilesController` requires JWT, but `FilesRepository.getOne(id)` fetches by UUID only and the file ability grants GET broadly. If a file UUID leaks via app definitions, audit logs, or profile/avatar references, any authenticated user can fetch bytes. Response splitting is mitigated by Node header validation, and browser XSS is mitigated by Helmet `nosniff`, so the confirmed issue is authorization. Fix direction: add ownership/organization metadata to files or join through referencing resources before serving.

**gRPC filesystem access (F2).** `validateFilesystemAccess()` resolves an arbitrary datasource directory, verifies it exists and is a directory, warns if it is outside project/home, then still returns it. A builder controlling gRPC datasource options can cause the server to glob/read proto files from readable filesystem paths. Fix direction: enforce an allowlisted proto root, reject absolute/outside paths, and avoid logging/returning filesystem details.

### Dependency And Supply Chain

**Likely runtime dependency findings.** `multer`, `nodemailer`, `path-to-regexp`, Nest core, DOMPurify, jsPDF/autotable, Draft.js/immutable, marketplace axios, AWS SDK XML builder, and OTel/systeminformation are present at vulnerable versions and have reachable import or request-adjacent paths. These were not exploited locally because the boundary only allowed static/local reproduction and some require package-specific PoCs. Fix direction: update lockfiles with targeted overrides and pair breaking frontend upgrades with rendering/export tests.

**Likely supply-chain/deployment findings.** `bcrypt` install-time issues and deprecated/EOL packages are confirmed hygiene risks for self-hosted operators or CI, not live request-path bugs. Fix direction: upgrade native/build dependencies, remove unused direct dependencies, and fail CI on newly introduced critical/high runtime advisories.

## Dismissal Rationale: Unlikely And False Positive

| ID | Rationale |
|---|---|
| DEP-S1 | No CE callsite imports or executes `simple-git`. |
| DEP-S2 | `protobuf.parse()` input is a server-side proto file, not attacker-controlled CE UI/API input. |
| DEP-S3 | Handlebars template source is server-controlled; data is not the vulnerable template/AST input. |
| DEP-S7 | No direct Undici WebSocket/parser surface found in CE. |
| DEP-S9 | SAML/PKI surface is not implemented in CE. |
| DEP-S12 | Browser axios cannot SSRF cloud metadata; no unsafe user config merge confirmed. |
| DEP-S16 | No Nest microservice listener exists. |
| DEP-S17 | Direct `fast-xml-parser` dependency is unused in CE source. |
| DEP-S18 | `xmldom` is tied to non-implemented SAML path in CE. |
| DEP-S19 | i18next language and load path are server-configured, not request-controlled. |
| DEP-H2 | Install scripts appear to be expected build/native scripts. |
| A6 | JWT expiry is ignored, but DB session expiry is enforced on guarded paths. |
| A7 | Equality comparison is non-constant-time, but no practical remote timing oracle was confirmed. |
| A8 | Name lookup is broad, but valid token is still required. |
| A10 | Onboarding guards implement the intended first-user/signup gates. |
| I5 | `eval()` is bad, but request-controlled log strings did not produce a practical escape from `util.inspect` formatting. |
| S9 | Missing HTTP proxy is an absent control, not a standalone exploit. |
| K1 | Logged random bytes are from a separate call and are not used in the generated TJDB password. |
| K6 | CRLF response splitting is mitigated by Node header validation; MIME XSS is limited by Helmet `nosniff`. |
| K9 | Test-only credentials. |
| F3 | Operator-controlled log path only. |
| F4 | Import does not install arbitrary plugins; it filters out uninstalled marketplace plugin datasource references. |
| X2 | `style.innerHTML` does not parse `</style><script>` into executable sibling elements. |
| X5 | Observed `helpText` callsites are static/i18n strings. |
| X6 | DOMPurify is used on these widget paths; bypass risk is covered as dependency risk. |
| C5 | Four password characters use `Math.random()`, but remaining entropy is high and not logged. |
| C6 | Transaction ID is log-only. |
| C7 | HKDF finding is compatibility/operational, not a confirmed security bug. |
| C9 | SCIM timing concern is secondary and impractical compared with A1. |
| R2 | Regexes are imperfect but no catastrophic local ReDoS path was confirmed. |
| R4 | Operator-only lockbox scripts. |
| R5 | Resource limits exist and no current caller passes host `require`; M3/M4 cover latent concerns. |
| M3 | Dangerous `require` bridge exists but is not currently reachable from server callers. |
| M4 | Shared isolate state is limited to author-controlled workflow execution. |
| M12 | Admin-gated explicit role-change flag appears intended. |
| M13 | Plugin controller has `JwtAuthGuard`; public-app shortcut cannot make it anonymous. |
| M15 | Future cookie-name issue; no current sibling sensitive cookie confirmed. |
| M16 | Git `userinfoResponse` containing `access_token` is built but not stored in `user_details.sso_user_info` in CE. |

## Customer Questions

1. Are workspace builders/admins considered trusted to execute arbitrary code on self-hosted ToolJet? This changes M2 from "privileged RCE" to "intended operator extensibility."
2. Is `ENABLE_CORS=true` or `ENABLE_PRIVATE_APP_EMBED=true` used in production? If yes, C1/C2 severity increases because cookie-authenticated CSRF becomes practical.
3. Is `FORWARD_RESTAPI_COOKIES=true` enabled for any customer deployments? If yes, S7/M14 become high-risk cross-origin session issues.
4. Do customer deployments allow arbitrary outbound network egress from the ToolJet server? If egress is restricted at the network layer, SSRF severity drops.
5. Are public apps allowed to execute queries that include user-controlled query variables? If yes, SQL/template and SSRF findings involving public apps are more exploitable.
6. Are audit logs exposed to workspace admins, exported, or shipped to third-party log systems? This changes M18/K3/K4/K5 severity.
7. Do self-hosted installation guides generate unique `LOCKBOX_MASTER_KEY`, `SECRET_KEY_BASE`, `PGRST_JWT_SECRET`, and `TOOLJET_QUEUE_DASH_PASSWORD`, or do users copy `.env.example`? This changes deployment-secret severity.
8. Is SAML/EE code present in customer builds even though it is absent/not implemented in this CE clone? If yes, DEP-S9/DEP-S18 need revalidation against that code.
9. Are app slugs globally intended to be unique and public across all workspaces? If not, A3/M6 slug-to-workspace stamping should be treated as a stronger tenant-boundary bug.
10. What roles can install marketplace plugins in production? If builders can install arbitrary GitHub repo plugins, M2 is critical in self-hosted multi-tenant deployments.
