# ToolJet Security Triage

Scope: final customer-facing triage of `VALIDATION.md`, `DEP_AUDIT.md`, and `CODE_REVIEW.md`.

Commit: `8ce1dcca884601405c26f4e049cda27e68dfb5d0`

Only findings marked `Confirmed` or `Likely` in validation were retained. Duplicates were collapsed by root cause.

## Executive Severity Counts

| Severity | Count |
|---|---:|
| Critical | 3 |
| High | 16 |
| Medium | 8 |
| Low | 3 |
| Info | 0 |
| **Total** | **30** |

| Status | Count |
|---|---:|
| Confirmed | 18 |
| Likely | 12 |

## Priority Remediation Roadmap

| Priority | Timeframe | Findings | Remediation focus |
|---|---|---|---|
| P0 | 0-7 days | TJ-001, TJ-002, TJ-003 | Close direct auth bypasses and host RCE. Add startup validation for SCIM secrets, remove arbitrary plugin code execution, and require password or signed invite proof in invite login. |
| P1 | 1-3 weeks | TJ-004 through TJ-019 | Fix tenant boundaries, OAuth state validation, public-app authorization, connector SSRF and injection paths, session cookie tossing, stored XSS, file IDOR, and high-impact vulnerable runtime dependencies. |
| P2 | 30-60 days | TJ-020 through TJ-027 | Hash and rotate webhook/reset/invite tokens, redact logs and audit metadata, lower body parser limits, correct secret-resolution regexes, and enforce strong deployment secrets. |
| P3 | Backlog / hardening | TJ-028 through TJ-030 | Harden cookie flags, tighten CSP, and remove build-time or deprecated dependency risk. |

## Final Findings Table

| ID | Title | Severity | Status | Type | Fix complexity |
|---|---|---|---|---|---|
| TJ-001 | SCIM bearer auth bypass when token secret is unset | Critical | Confirmed | Authentication | Small |
| TJ-002 | Marketplace plugin install executes attacker-controlled code with host privileges | Critical | Confirmed | Code Execution | Large |
| TJ-003 | Invitation login path can skip password verification | Critical | Confirmed | Authentication | Medium |
| TJ-004 | Cross-tenant data-source actions via unscoped `dataSourceId` lookup | High | Likely | Authorization | Medium |
| TJ-005 | Public-app authorization and workspace stamping trust global slugs | High | Likely | Authorization | Large |
| TJ-006 | OAuth lacks state binding and Git SSO host is workspace-configurable | High | Likely | Authentication | Medium |
| TJ-007 | Unsafe connector query construction enables SQL and NoSQL injection | High | Confirmed | Injection | Large |
| TJ-008 | Query-time host and connection target rewriting can redirect stored credentials | High | Confirmed | SSRF | Medium |
| TJ-009 | Outbound connectors allow SSRF to internal resources | High | Confirmed | SSRF | Large |
| TJ-010 | REST connector cookie bridging allows session fixation | High | Confirmed | Session Management | Medium |
| TJ-011 | Stored comment mention rendering XSS | High | Confirmed | XSS | Small |
| TJ-012 | Table and highlighted-cell rendering can inject unsanitized HTML | High | Likely | XSS | Medium |
| TJ-013 | Credentialed CORS reflection and embed cookies enable cross-origin authenticated access | High | Confirmed | CORS / CSRF | Medium |
| TJ-014 | File UUID lookup lacks tenant or ownership scope | High | Confirmed | Authorization | Medium |
| TJ-015 | gRPC proto directory validation warns but still reads outside allowed roots | High | Confirmed | File Access | Medium |
| TJ-016 | Editors can publish apps and change public slugs | High | Confirmed | Authorization | Medium |
| TJ-017 | Frontend sanitizer, PDF, and editor dependencies remain vulnerable in rendered surfaces | High | Likely | Vulnerable Dependency | Medium |
| TJ-018 | Server and plugin outbound dependencies expose SSRF, XML, and command-injection risk | High | Likely | Vulnerable Dependency | Medium |
| TJ-019 | Reset and invitation tokens are plaintext, unexpired, and weakly throttled | High | Confirmed | Token Management | Medium |
| TJ-020 | Workflow webhook tokens are plaintext and replayable | Medium | Confirmed | Token Management | Medium |
| TJ-021 | Folder update is not scoped by organization | Medium | Confirmed | Authorization | Small |
| TJ-022 | Data-source update audit metadata can retain plaintext credentials | Medium | Confirmed | Sensitive Data Exposure | Small |
| TJ-023 | Telemetry and HTTP error logging can expose PII or upstream secrets | Medium | Confirmed | Logging | Medium |
| TJ-024 | Reachable upload, email, and route parsing dependencies allow moderate DoS | Medium | Likely | Denial of Service | Medium |
| TJ-025 | Global request body and parameter limits are overly large | Medium | Likely | Denial of Service | Small |
| TJ-026 | Constants and secrets regex can overmatch server-side substitutions | Medium | Likely | Information Disclosure | Small |
| TJ-027 | Deployment defaults and missing secret validation can expose self-hosted instances | Medium | Likely | Configuration | Medium |
| TJ-028 | Auth cookie `Secure` flag depends on `TOOLJET_HOST` string parsing | Low | Likely | Cookie Hardening | Small |
| TJ-029 | Permissive CSP weakens XSS containment | Low | Confirmed | Hardening | Medium |
| TJ-030 | Build-time supply-chain and EOL dependency hygiene risk remains | Low | Likely | Supply Chain | Medium |

## Detailed Finding Entries

### TJ-001 - SCIM bearer auth bypass when token secret is unset

Severity: Critical

Status: Confirmed

Affected files: `server/src/modules/scim/guards/scim-auth.guard.ts`

Impact: When SCIM is enabled but `SCIM_HEADER_AUTH_TOKEN` is unset, an `Authorization: Bearer` header can satisfy the guard because the parsed token and configured token are both `undefined`. This bypasses SCIM route authentication.

Reproduction summary: Inspect the guard token extraction and comparison. With SCIM enabled and the header token unset, send a SCIM request with `Authorization: Bearer`.

Recommended fix: Fail startup when SCIM is enabled without exactly one valid auth secret, reject empty bearer values, and compare configured secrets with `crypto.timingSafeEqual`.

Fix complexity: Small

### TJ-002 - Marketplace plugin install executes attacker-controlled code with host privileges

Severity: Critical

Status: Confirmed

Affected files: `server/src/modules/plugins/controller.ts:32`, `server/src/modules/plugins/service.ts:24`, `server/src/modules/plugins/util.service.ts:79`, `server/src/modules/data-sources/services/plugin-selector.service.ts:39`

Impact: A builder or admin can install a plugin from an attacker-controlled GitHub repository. The plugin is later executed with Node host primitives including `require`, `process`, `global`, `Buffer`, and filesystem/network access, resulting in host RCE and broad secret extraction.

Reproduction summary: Install a plugin whose bundled JS reads `process.env` or executes `child_process.execSync`, then configure a datasource that loads the plugin.

Recommended fix: Disable arbitrary `repo` plugin installation in production, require signed marketplace packages, run plugins out of process behind a narrow RPC API, and never expose host `require` or `process` to plugin code.

Fix complexity: Large

### TJ-003 - Invitation login path can skip password verification

Severity: Critical

Status: Confirmed

Affected files: `server/src/modules/auth/service.ts`

Impact: `redirectTo` values beginning with invitation paths route login through an invite branch that fetches an invited user by email without normal password verification. This creates a passwordless login path for invited accounts.

Reproduction summary: Use the login endpoint with an invited user's email and an invitation-style `redirectTo` value, then observe the invite branch bypassing the normal password check.

Recommended fix: Always verify the password for credential login, or require a signed, single-use invite session proof that is bound to the invitation token and expires quickly.

Fix complexity: Medium

### TJ-004 - Cross-tenant data-source actions via unscoped `dataSourceId` lookup

Severity: High

Status: Likely

Affected files: `server/src/modules/data-queries/guards/validate-query-source.guard.ts:43`, `server/src/modules/data-sources/repository.ts:125`, `server/src/modules/data-queries/ability/data-source/index.ts`, `server/src/modules/ability/util.service.ts:99`

Impact: Data-source lookup by UUID is not scoped to the request organization. A user with all-data-source permissions in their current workspace can potentially list or create queries against a foreign workspace datasource if they know the UUID.

Reproduction summary: Seed two organizations, capture a datasource UUID from one, and call list-tables or data-query creation from another workspace where the user has `isAllUsable`.

Recommended fix: Require `organizationId` on all datasource lookups used by guards and reject requests when the datasource organization differs from the authenticated workspace.

Fix complexity: Medium

### TJ-005 - Public-app authorization and workspace stamping trust global slugs

Severity: High

Status: Likely

Affected files: `server/src/modules/apps/guards/app-auth.guard.ts:33`, `server/src/modules/app/guards/ability.guard.ts:111`, `server/src/modules/app/constants/module-info.ts`

Impact: Public app guards look up slugs globally and stamp `tj-workspace-id` from the app's organization. The ability guard then skips authorization for public apps unless a feature opts out, which can expose routes through a public-app trust boundary.

Reproduction summary: Use a public app slug and anonymously exercise routes whose feature metadata does not set `shouldNotSkipPublicApp`.

Recommended fix: Make public access route-allowlist based, never mutate workspace headers as if they came from an authenticated user, and enforce resource-specific organization checks on every public route.

Fix complexity: Large

### TJ-006 - OAuth lacks state binding and Git SSO host is workspace-configurable

Severity: High

Status: Likely

Affected files: `server/src/modules/auth/oauth/service.ts:64`, `server/src/modules/auth/oauth/util-services/git-oauth.service.ts:11`, `server/src/modules/login-configs/util.service.ts:99`

Impact: OAuth callbacks accept `state` without server-side validation. Git SSO token and userinfo URLs are derived from workspace configuration, allowing a malicious SSO host to return attacker-controlled identities when an attacker can configure login settings.

Reproduction summary: Mutate an OAuth callback state and observe acceptance, then configure a Git SSO host that returns chosen userinfo.

Recommended fix: Store and validate OAuth state and PKCE bindings, restrict custom Git hosts to explicit allowlists, and document or gate self-hosted Git SSO as a trusted-admin feature.

Fix complexity: Medium

### TJ-007 - Unsafe connector query construction enables SQL and NoSQL injection

Severity: High

Status: Confirmed

Affected files: `plugins/packages/*/lib/index.ts`, `server/src/modules/data-queries/util.service.ts`, `server/lib/utils.ts`

Impact: GUI query builders and template substitution paths concatenate table names, column names, values, BigQuery conditions, Mongo filters, and SAP HANA raw queries. End users can become attackers when unsafe template variables are exposed in published apps.

Reproduction summary: Configure SQL, BigQuery, MongoDB, or SAP HANA queries with templated user input and observe the generated driver query text or filter object containing untrusted data.

Recommended fix: Use driver-native parameters in GUI modes, quote identifiers with connector helpers, make raw SQL interpolation explicit, and reject unsafe string substitution in GUI builders.

Fix complexity: Large

### TJ-008 - Query-time host and connection target rewriting can redirect stored credentials

Severity: High

Status: Confirmed

Affected files: `plugins/packages/openapi/lib/index.ts`, `plugins/packages/mongodb/lib/index.ts`, `plugins/packages/*/lib/index.ts`

Impact: OpenAPI path and host overrides, SQL dynamic connection parameters, and MongoDB URI construction allow query options to change outbound targets or connection hosts while using stored credentials.

Reproduction summary: Supply OpenAPI path parameters or query host options that alter the resolved URL, or supply dynamic database connection options that rewrite host/database before connection.

Recommended fix: URL-encode path segments, remove query-time host overrides or gate them behind a distinct permission, build database URLs with structured URL APIs, and validate outbound hosts against allowlists.

Fix complexity: Medium

### TJ-009 - Outbound connectors allow SSRF to internal resources

Severity: High

Status: Confirmed

Affected files: `plugins/packages/restapi/lib/index.ts`, `plugins/packages/graphql/lib/index.ts`, `plugins/packages/openapi/lib/index.ts`, `plugins/packages/grpcv2/lib/operations.ts`, `plugins/packages/*/lib/index.ts`

Impact: REST, OpenAPI, GraphQL, InfluxDB, CouchDB, n8n, and gRPC proto URL flows pass user-controlled or builder-controlled URLs to outbound HTTP clients without scheme, DNS, or IP range restrictions. This can reach internal services and cloud metadata endpoints.

Reproduction summary: Configure or trigger a connector URL targeting loopback, link-local, private network, or metadata endpoints and observe the server making the request.

Recommended fix: Centralize outbound HTTP, allow only approved schemes, block loopback/link-local/private IPs after DNS resolution, pin DNS per request, and provide connector-level allowlists.

Fix complexity: Large

### TJ-010 - REST connector cookie bridging allows session fixation

Severity: High

Status: Confirmed

Affected files: `server/src/modules/data-queries/util.service.ts:130`, `server/src/modules/data-queries/util.service.ts:440`, `server/src/modules/session/util.service.ts:106`

Impact: Upstream REST responses can set arbitrary cookie names on the ToolJet origin, including `tj_auth_token`. If cookie forwarding is enabled, client cookies can also be sent to arbitrary upstreams with only a narrow prefix filter.

Reproduction summary: Point a REST datasource at an attacker endpoint that returns `Set-Cookie: tj_auth_token=...` and inspect ToolJet's response cookie.

Recommended fix: Do not forward browser cookies to arbitrary datasource hosts by default, block every ToolJet-reserved cookie name in both directions, and allow cookie bridging only for explicitly trusted same-site hosts.

Fix complexity: Medium

### TJ-011 - Stored comment mention rendering XSS

Severity: High

Status: Confirmed

Affected files: `frontend/src`, comment mention rendering helpers, notification rendering components

Impact: Comment text is stored user input. Mention highlighting returns HTML that is rendered with `dangerouslySetInnerHTML` without final escaping or sanitization, allowing stored XSS against workspace users.

Reproduction summary: Create a comment containing HTML or script-bearing payload around mention syntax and view the comment, comment notification, or notification center.

Recommended fix: Render mentions as React nodes instead of HTML strings, or sanitize after all mention highlighting transformations.

Fix complexity: Small

### TJ-012 - Table and highlighted-cell rendering can inject unsanitized HTML

Severity: High

Status: Likely

Affected files: `frontend/src`, table string column and highlighted-cell renderers

Impact: Editable string cells and highlighted-cell paths can pass datasource values through `dangerouslySetInnerHTML` without sanitizing after transformations. Query results or editable table values can become XSS payloads.

Reproduction summary: Return HTML from a datasource into an editable string column or highlighted table cell and observe browser rendering behavior.

Recommended fix: Prefer text nodes for string columns and sanitize every value after all highlighting or formatting steps, immediately before HTML insertion.

Fix complexity: Medium

### TJ-013 - Credentialed CORS reflection and embed cookies enable cross-origin authenticated access

Severity: High

Status: Confirmed

Affected files: `server/src/helpers/bootstrap.helper.ts:222`, `server/src/modules/session/util.service.ts:106`

Impact: `ENABLE_CORS=true` reflects arbitrary origins while allowing credentials. Private app embed mode sets auth cookies to `SameSite=None`, and no general CSRF token layer was found. Hostile origins can issue credentialed requests and, with reflected CORS, read responses.

Reproduction summary: Enable CORS reflection, then from a separate origin issue `fetch()` with `credentials: "include"` to a ToolJet API endpoint and inspect the CORS response.

Recommended fix: Replace reflected CORS with an explicit origin allowlist, enforce CSRF tokens or strict origin checks for cookie-authenticated mutations, and scope embed mode narrowly.

Fix complexity: Medium

### TJ-014 - File UUID lookup lacks tenant or ownership scope

Severity: High

Status: Confirmed

Affected files: `server/src/modules/files/repository.ts:21`, `server/src/modules/files/service.ts:10`

Impact: Authenticated users can fetch a file by UUID without an organization or ownership predicate. If a UUID leaks through app definitions, exports, logs, or references, file bytes can be read across tenant boundaries.

Reproduction summary: Authenticate as a user in one organization and request a known file UUID from another organization.

Recommended fix: Add ownership and organization metadata to file records or authorize through the resource that references the file before serving bytes.

Fix complexity: Medium

### TJ-015 - gRPC proto directory validation warns but still reads outside allowed roots

Severity: High

Status: Confirmed

Affected files: `plugins/packages/grpcv2/lib/operations.ts`, gRPC datasource filesystem validation helpers

Impact: A builder-controlled gRPC datasource directory can point outside expected project or home roots. The server warns but continues scanning and reading proto files from readable filesystem paths.

Reproduction summary: Configure a gRPC datasource with an absolute or outside-root proto directory and observe the warning followed by file scanning.

Recommended fix: Reject absolute or outside-root paths, enforce an allowlisted proto root, and avoid returning or logging sensitive filesystem details.

Fix complexity: Medium

### TJ-016 - Editors can publish apps and change public slugs

Severity: High

Status: Confirmed

Affected files: `server/src/modules/apps/ability/app.ability.ts:81`, `server/src/modules/apps/controller.ts`, `server/src/entities/app.entity.ts`

Impact: Users who can edit an app can toggle public access and alter the globally unique slug. This can expose apps anonymously and allow slug squatting.

Reproduction summary: Assign an editor role, call the public-app update endpoint, and verify the app is reachable without authentication.

Recommended fix: Split publish and slug management into separate admin-controlled permissions and add audit events for public exposure changes.

Fix complexity: Medium

### TJ-017 - Frontend sanitizer, PDF, and editor dependencies remain vulnerable in rendered surfaces

Severity: High

Status: Likely

Affected files: `frontend/package.json`, `frontend/package-lock.json`

Impact: Vulnerable versions of DOMPurify, jsPDF, jspdf-autotable, Draft.js, and immutable are used in user-rendered HTML, rich text, and PDF export surfaces. Exploitation depends on browser payloads but would be amplified by the permissive CSP.

Reproduction summary: Review the frontend lockfile and callsites for DOMPurify, PDF export, and Draft.js editor rendering.

Recommended fix: Upgrade DOMPurify, jsPDF, jspdf-autotable, and immutable; plan a Draft.js replacement or isolation; add rendering and export regression tests.

Fix complexity: Medium

### TJ-018 - Server and plugin outbound dependencies expose SSRF, XML, and command-injection risk

Severity: High

Status: Likely

Affected files: `server/package.json`, `server/package-lock.json`, `plugins/package-lock.json`, `marketplace/package-lock.json`

Impact: Vulnerable versions of plugin-side axios, AWS SDK XML builder chains, and the pinned `systeminformation` override can affect server-side outbound connectors and OpenTelemetry host metrics. Risks include SSRF/metadata exposure, XML parser issues, and conditional command injection.

Reproduction summary: Inspect lockfiles and reachable imports for plugin axios, AWS SDK clients, and `nestjs-otel` host metrics with `systeminformation`.

Recommended fix: Add axios and AWS SDK overrides or lockfile upgrades, update or remove the `systeminformation` override, and test connector and OTel smoke paths.

Fix complexity: Medium

### TJ-019 - Reset and invitation tokens are plaintext, unexpired, and weakly throttled

Severity: High

Status: Confirmed

Affected files: `server/src/modules/auth/service.ts:215`, `server/src/modules/onboarding/service.ts:398`, `server/src/modules/auth/controller.ts`, `server/src/entities/user.entity.ts`, `server/src/entities/organization_user.entity.ts`

Impact: Password reset and invitation tokens are stored in plaintext with no expiry enforcement. A database snapshot or log exposure can yield working reset and invite links indefinitely, and pending invites can survive inviter demotion.

Reproduction summary: Issue a reset or invite token, inspect storage, wait beyond a normal expiry window, and redeem the token.

Recommended fix: Store only token hashes, add expiry columns and checks, rate-limit issuance and redemption, and revalidate inviter authority at invite acceptance.

Fix complexity: Medium

### TJ-020 - Workflow webhook tokens are plaintext and replayable

Severity: Medium

Status: Confirmed

Affected files: `server/src/entities/app.entity.ts`, `server/src/modules/licensing/guards/webhook.guard.ts:27`, `server/src/modules/licensing/guards/webhook.guard.ts:113`

Impact: Workflow API tokens are stored plaintext and compared directly. Captured requests can be replayed because there is no nonce, timestamp, HMAC, or replay cache.

Reproduction summary: Capture a valid workflow trigger request and replay it, or inspect the `apps.workflow_api_token` column and guard comparison.

Recommended fix: Hash workflow tokens at rest, compare fixed-length hashes with `timingSafeEqual`, add rotation, and support HMAC timestamp and nonce replay protection.

Fix complexity: Medium

### TJ-021 - Folder update is not scoped by organization

Severity: Medium

Status: Confirmed

Affected files: `server/src/modules/folders/service.ts:37`

Impact: Folder update filters by ID only, unlike deletion which includes `organizationId`. A user with folder update permission and a foreign folder UUID can rename another tenant's folder.

Reproduction summary: Seed two organizations, learn a folder UUID from one, and call the update route from the other.

Recommended fix: Add `organizationId` to the update predicate and add a regression test comparing update and delete scoping.

Fix complexity: Small

### TJ-022 - Data-source update audit metadata can retain plaintext credentials

Severity: Medium

Status: Confirmed

Affected files: `server/src/modules/data-sources/service.ts:140`, `server/src/entities/audit_log.entity.ts`

Impact: Datasource update audit metadata can include the plaintext update DTO before sensitive options are encrypted for storage. Audit-log readers or exports can receive datasource credentials.

Reproduction summary: Update a datasource password, then inspect the corresponding audit log metadata for the submitted value.

Recommended fix: Redact sensitive option keys before setting audit metadata and add tests for credential updates.

Fix complexity: Small

### TJ-023 - Telemetry and HTTP error logging can expose PII or upstream secrets

Severity: Medium

Status: Confirmed

Affected files: `server/src`, Sentry initialization, REST and OpenAPI connector error handlers

Impact: Sentry is configured with default PII and full tracing, custom spans can include request bodies, and REST/OpenAPI error handlers log upstream bodies or full error objects. Secrets can leak into logs and third-party telemetry.

Reproduction summary: Trigger REST/OpenAPI upstream errors containing sensitive response bodies and inspect application logs and telemetry configuration.

Recommended fix: Disable default PII, redact request and response bodies, avoid logging full error objects, and log structured metadata only.

Fix complexity: Medium

### TJ-024 - Reachable upload, email, and route parsing dependencies allow moderate DoS

Severity: Medium

Status: Likely

Affected files: `server/package.json`, `server/package-lock.json`, `server/src/modules/profile/controller.ts`, `server/src/modules/tooljet-db/controller.ts`, `server/src/modules/organization-users/controller.ts`, `server/src/modules/email/util.service.ts`

Impact: Vulnerable versions of multer, nodemailer, path-to-regexp, and Nest core sit on reachable upload, email, and route parsing paths. The likely practical impact is request-driven resource exhaustion.

Reproduction summary: Review lockfile versions and reachable FileInterceptor, sendMail, and parameterized Nest route callsites.

Recommended fix: Upgrade Nest packages and multer, move nodemailer to a fixed major version after API review, and add route or endpoint-level throttles.

Fix complexity: Medium

### TJ-025 - Global request body and parameter limits are overly large

Severity: Medium

Status: Likely

Affected files: `server/src/helpers/bootstrap.helper.ts`

Impact: The server accepts large JSON bodies and a very high URL-encoded parameter count. Public or unauthenticated endpoints can be used for moderate resource exhaustion.

Reproduction summary: Inspect global body parser limits and drive large JSON or URL-encoded requests at public endpoints.

Recommended fix: Lower global limits, set endpoint-specific upload limits, and throttle public auth, import, and upload routes.

Fix complexity: Small

### TJ-026 - Constants and secrets regex can overmatch server-side substitutions

Severity: Medium

Status: Likely

Affected files: `server/src/modules/data-sources/util.service.ts`

Impact: The constants/secrets/globals regex has incorrect alternation precedence and can trigger broader server-side resolution than intended, potentially exposing tenant-scoped constants or secrets in connector execution.

Reproduction summary: Review the matcher and test template values that include `constants`, `secrets`, or `globals.server` variants.

Recommended fix: Replace the matcher with a grouped expression such as `/{{(?:constants|secrets|globals\\.server)\\.[^}]+}}/g` and add unit tests for non-matching variants.

Fix complexity: Small

### TJ-027 - Deployment defaults and missing secret validation can expose self-hosted instances

Severity: Medium

Status: Likely

Affected files: `.env.example`, `server/src/modules/app/module.ts`, server startup configuration

Impact: Example and runtime configuration allow weak or missing secrets such as an all-zero `LOCKBOX_MASTER_KEY`, empty `PGRST_JWT_SECRET`, and missing queue dashboard password. Self-hosted deployments that copy defaults can expose credentials or job payloads.

Reproduction summary: Start from example configuration with weak or unset secrets and inspect application startup, credential encryption, PostgREST signing, and `/jobs` dashboard behavior.

Recommended fix: Fail startup on missing or known-default secrets, generate install-time secrets, and disable privileged dashboards unless a strong password is configured.

Fix complexity: Medium

### TJ-028 - Auth cookie `Secure` flag depends on `TOOLJET_HOST` string parsing

Severity: Low

Status: Likely

Affected files: `server/src/helpers/utils.helper.ts`, `server/src/modules/session/util.service.ts:113`

Impact: TLS-terminating proxy deployments can accidentally issue non-secure auth cookies if `TOOLJET_HOST` is set to an internal HTTP URL.

Reproduction summary: Run behind a TLS proxy with `TOOLJET_HOST=http://...` and inspect `Set-Cookie` attributes.

Recommended fix: Add explicit `COOKIE_SECURE=true` and trusted proxy configuration rather than deriving cookie security solely from public host string parsing.

Fix complexity: Small

### TJ-029 - Permissive CSP weakens XSS containment

Severity: Low

Status: Confirmed

Affected files: `server/src/helpers/bootstrap.helper.ts`

Impact: CSP allows inline script, eval, broad connections, and broad frames. This does not create XSS by itself but substantially weakens containment for confirmed and likely XSS issues.

Reproduction summary: Inspect the CSP directives configured at server bootstrap.

Recommended fix: Remove `unsafe-inline` and `unsafe-eval`, add nonces or hashes where needed, narrow `connect-src`, and set `frame-ancestors` from explicit embed settings.

Fix complexity: Medium

### TJ-030 - Build-time supply-chain and EOL dependency hygiene risk remains

Severity: Low

Status: Likely

Affected files: `server/package.json`, `server/package-lock.json`, `frontend/package-lock.json`, `plugins/package-lock.json`, `marketplace/package-lock.json`

Impact: Build-time and deprecated dependency chains such as bcrypt/node-pre-gyp, abandoned frontend libraries, older Lerna/Nx chains, and other EOL packages increase maintenance and supply-chain risk, especially for self-hosted builds that run installs on production hosts.

Reproduction summary: Review dependency audit output, deprecated package metadata, and install-script inventory.

Recommended fix: Upgrade bcrypt, replace abandoned libraries, remove unused direct dependencies, and fail CI on newly introduced critical or high runtime advisories.

Fix complexity: Medium
