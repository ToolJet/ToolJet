# ToolJet Security Audit Report

## 1. Executive Summary

**Project:** ToolJet

**Repository:** `https://github.com/ToolJet/ToolJet`

**Audited commit:** `8ce1dcca884601405c26f4e049cda27e68dfb5d0`

**Branch and release line:** `develop`; root `package.json` declares ToolJet `1.18.0`, Node `22.15.1`, and npm `10.9.2`.

**Scope:** Community Edition source present in this checkout. `server/ee/` is empty, so EE-only SAML/OIDC/LDAP, SCIM extensions, workflow webhook implementation details, AI/agent features, instance settings, white-labelling, and external API implementations were not fully reviewable. Marketplace plugins were treated as out-of-tree unless they were directly relevant to installed dependency risk.

**Allowed testing boundary:** Static analysis, lockfile inspection, local source review, and local-only reproduction reasoning against this clone. No probing was performed against `tooljet.com`, customer-hosted instances, cloud metadata services, GitHub, npm, AWS, or any third-party service configured as a datasource.

**Audit depth:** Standard. The audit combined repository reconnaissance, dependency review, Semgrep SAST, targeted grep sweeps, manual code review, validation, and final triage.

**Result:** 30 customer-facing findings were retained from 107 candidates. Retained findings are only those marked `Confirmed` or `Likely` after validation and deduplication by root cause.

### Severity Counts

| Severity | Count |
|---|---:|
| Critical | 3 |
| High | 16 |
| Medium | 8 |
| Low | 3 |
| Info | 0 |
| **Total** | **30** |

### Status Counts

| Status | Count |
|---|---:|
| Confirmed | 18 |
| Likely | 12 |

### Highest-Risk Themes

The three Critical findings are an authentication bypass in SCIM when its bearer secret is unset, host-level code execution through arbitrary marketplace plugin installation, and a password-verification bypass in the invitation login path. High-risk follow-on areas include tenant-boundary failures, connector SSRF and injection, session fixation via REST cookie bridging, stored XSS, file UUID access without tenant scope, vulnerable rendered-surface dependencies, and weak reset/invite token handling.

## 2. Methodology

### Dependency Audit

The dependency review used lockfile-only `npm audit --json --package-lock-only` across the root, `server/`, `frontend/`, `plugins/`, `cli/`, `marketplace/`, and `cypress-tests/` workspaces. No package installation or network package installation was performed. Lockfiles were inspected for vulnerable direct and transitive packages, install scripts, deprecated packages, non-registry sources, and runtime reachability through import/callsite review.

Reachability was prioritized over raw scanner severity. For example, unused CE dependencies such as direct `simple-git` and direct `fast-xml-parser` were not retained as customer-facing runtime vulnerabilities, while vulnerable frontend rendering packages and server/plugin outbound dependency chains were retained where callsites and request-adjacent paths exist.

### SAST

Semgrep `1.161.0` was run against `server/` and `plugins/` using OWASP, TypeScript, JavaScript, NodeJS, and security-audit rulesets. The scan covered 1,996 files and produced 76 raw findings with no rule errors. Targeted ripgrep sweeps supplemented Semgrep for raw SQL, child processes, eval and VM usage, outbound HTTP, URL construction, sensitive logging, filesystem access, archives, crypto/session usage, cookies, frontend `dangerouslySetInnerHTML`, and public/JWT guard patterns.

### Manual Review

Manual review walked the NestJS guard/controller/service call chains and connector execution paths most likely to produce scanner misses: cross-tenant authorization, public-app trust boundaries, plugin loading, query construction, secrets and audit logging, OAuth/SSO, workflow webhooks, files, imports, and deployment defaults.

### Validation

Validation combined source-level proof, lockfile inspection, local grep/Node checks, and reasoning over guard/controller/service paths. The validation pass categorized 107 candidates as Confirmed, Likely, Unlikely, or False Positive. Findings were retained only when exploitability was confirmed in code or remained likely based on reachable call paths and realistic deployment conditions.

### Triage

Final triage collapsed duplicate candidates by root cause and assigned customer-facing IDs `TJ-001` through `TJ-030`. Severity, status, CWE, affected code, impact, reproduction summary, recommendation, and fix complexity were reconciled against `TRIAGE.md` and `FINDINGS.json`.

### Limitations

This was not a live DAST engagement. No customer instances, ToolJet production services, third-party APIs, or cloud metadata services were probed. EE source was not available in this checkout. Several likely findings require customer configuration confirmation, seeded multi-tenant data, browser PoCs, or a running local instance to fully demonstrate impact.

## 3. Findings

### TJ-001 - SCIM bearer auth bypass when token secret is unset

| Field | Detail |
|---|---|
| Severity | Critical |
| Status | Confirmed |
| Type / CWE | Authentication / CWE-287 |
| Affected code | `server/src/modules/scim/guards/scim-auth.guard.ts` |
| Fix complexity | Small |

**Impact:** When SCIM is enabled but `SCIM_HEADER_AUTH_TOKEN` is unset, an `Authorization: Bearer` header can satisfy the guard because the parsed token and configured token are both `undefined`. This bypasses SCIM route authentication.

**Reproduction summary:** Inspect the guard token extraction and comparison. With SCIM enabled and the header token unset, send a SCIM request with `Authorization: Bearer`.

**Recommended fix:** Fail startup when SCIM is enabled without exactly one valid auth secret, reject empty bearer values, and compare configured secrets with `crypto.timingSafeEqual`.

### TJ-002 - Marketplace plugin install executes attacker-controlled code with host privileges

| Field | Detail |
|---|---|
| Severity | Critical |
| Status | Confirmed |
| Type / CWE | Code Execution / CWE-94 |
| Affected code | `server/src/modules/plugins/controller.ts:32`; `server/src/modules/plugins/service.ts:24`; `server/src/modules/plugins/util.service.ts:79`; `server/src/modules/data-sources/services/plugin-selector.service.ts:39` |
| Fix complexity | Large |

**Impact:** A builder or admin can install a plugin from an attacker-controlled GitHub repository. The plugin is later executed with Node host primitives including `require`, `process`, `global`, `Buffer`, and filesystem/network access, resulting in host RCE and broad secret extraction.

**Reproduction summary:** Install a plugin whose bundled JavaScript reads `process.env` or executes `child_process.execSync`, then configure a datasource that loads the plugin.

**Recommended fix:** Disable arbitrary `repo` plugin installation in production, require signed marketplace packages, run plugins out of process behind a narrow RPC API, and never expose host `require` or `process` to plugin code.

### TJ-003 - Invitation login path can skip password verification

| Field | Detail |
|---|---|
| Severity | Critical |
| Status | Confirmed |
| Type / CWE | Authentication / CWE-287 |
| Affected code | `server/src/modules/auth/service.ts` |
| Fix complexity | Medium |

**Impact:** `redirectTo` values beginning with invitation paths route login through an invite branch that fetches an invited user by email without normal password verification. This creates a passwordless login path for invited accounts.

**Reproduction summary:** Use the login endpoint with an invited user's email and an invitation-style `redirectTo` value, then observe the invite branch bypassing the normal password check.

**Recommended fix:** Always verify the password for credential login, or require a signed, single-use invite session proof that is bound to the invitation token and expires quickly.

### TJ-004 - Cross-tenant data-source actions via unscoped `dataSourceId` lookup

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | Authorization / CWE-639 |
| Affected code | `server/src/modules/data-queries/guards/validate-query-source.guard.ts:43`; `server/src/modules/data-sources/repository.ts:125`; `server/src/modules/data-queries/ability/data-source/index.ts`; `server/src/modules/ability/util.service.ts:99` |
| Fix complexity | Medium |

**Impact:** Data-source lookup by UUID is not scoped to the request organization. A user with all-data-source permissions in their current workspace can potentially list or create queries against a foreign workspace datasource if they know the UUID.

**Reproduction summary:** Seed two organizations, capture a datasource UUID from one, and call list-tables or data-query creation from another workspace where the user has `isAllUsable`.

**Recommended fix:** Require `organizationId` on all datasource lookups used by guards and reject requests when the datasource organization differs from the authenticated workspace.

### TJ-005 - Public-app authorization and workspace stamping trust global slugs

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | Authorization / CWE-284 |
| Affected code | `server/src/modules/apps/guards/app-auth.guard.ts:33`; `server/src/modules/app/guards/ability.guard.ts:111`; `server/src/modules/app/constants/module-info.ts` |
| Fix complexity | Large |

**Impact:** Public app guards look up slugs globally and stamp `tj-workspace-id` from the app's organization. The ability guard then skips authorization for public apps unless a feature opts out, which can expose routes through a public-app trust boundary.

**Reproduction summary:** Use a public app slug and anonymously exercise routes whose feature metadata does not set `shouldNotSkipPublicApp`.

**Recommended fix:** Make public access route-allowlist based, never mutate workspace headers as if they came from an authenticated user, and enforce resource-specific organization checks on every public route.

### TJ-006 - OAuth lacks state binding and Git SSO host is workspace-configurable

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | Authentication / CWE-352 |
| Affected code | `server/src/modules/auth/oauth/service.ts:64`; `server/src/modules/auth/oauth/util-services/git-oauth.service.ts:11`; `server/src/modules/login-configs/util.service.ts:99` |
| Fix complexity | Medium |

**Impact:** OAuth callbacks accept `state` without server-side validation. Git SSO token and userinfo URLs are derived from workspace configuration, allowing a malicious SSO host to return attacker-controlled identities when an attacker can configure login settings.

**Reproduction summary:** Mutate an OAuth callback state and observe acceptance, then configure a Git SSO host that returns chosen userinfo.

**Recommended fix:** Store and validate OAuth state and PKCE bindings, restrict custom Git hosts to explicit allowlists, and document or gate self-hosted Git SSO as a trusted-admin feature.

### TJ-007 - Unsafe connector query construction enables SQL and NoSQL injection

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | Injection / CWE-89 |
| Affected code | `plugins/packages/*/lib/index.ts`; `server/src/modules/data-queries/util.service.ts`; `server/lib/utils.ts` |
| Fix complexity | Large |

**Impact:** GUI query builders and template substitution paths concatenate table names, column names, values, BigQuery conditions, Mongo filters, and SAP HANA raw queries. End users can become attackers when unsafe template variables are exposed in published apps.

**Reproduction summary:** Configure SQL, BigQuery, MongoDB, or SAP HANA queries with templated user input and observe the generated driver query text or filter object containing untrusted data.

**Recommended fix:** Use driver-native parameters in GUI modes, quote identifiers with connector helpers, make raw SQL interpolation explicit, and reject unsafe string substitution in GUI builders.

### TJ-008 - Query-time host and connection target rewriting can redirect stored credentials

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | SSRF / CWE-918 |
| Affected code | `plugins/packages/openapi/lib/index.ts`; `plugins/packages/mongodb/lib/index.ts`; `plugins/packages/*/lib/index.ts` |
| Fix complexity | Medium |

**Impact:** OpenAPI path and host overrides, SQL dynamic connection parameters, and MongoDB URI construction allow query options to change outbound targets or connection hosts while using stored credentials.

**Reproduction summary:** Supply OpenAPI path parameters or query host options that alter the resolved URL, or supply dynamic database connection options that rewrite host/database before connection.

**Recommended fix:** URL-encode path segments, remove query-time host overrides or gate them behind a distinct permission, build database URLs with structured URL APIs, and validate outbound hosts against allowlists.

### TJ-009 - Outbound connectors allow SSRF to internal resources

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | SSRF / CWE-918 |
| Affected code | `plugins/packages/restapi/lib/index.ts`; `plugins/packages/graphql/lib/index.ts`; `plugins/packages/openapi/lib/index.ts`; `plugins/packages/grpcv2/lib/operations.ts`; `plugins/packages/*/lib/index.ts` |
| Fix complexity | Large |

**Impact:** REST, OpenAPI, GraphQL, InfluxDB, CouchDB, n8n, and gRPC proto URL flows pass user-controlled or builder-controlled URLs to outbound HTTP clients without scheme, DNS, or IP range restrictions. This can reach internal services and cloud metadata endpoints.

**Reproduction summary:** Configure or trigger a connector URL targeting loopback, link-local, private network, or metadata endpoints and observe the server making the request.

**Recommended fix:** Centralize outbound HTTP, allow only approved schemes, block loopback/link-local/private IPs after DNS resolution, pin DNS per request, and provide connector-level allowlists.

### TJ-010 - REST connector cookie bridging allows session fixation

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | Session Management / CWE-384 |
| Affected code | `server/src/modules/data-queries/util.service.ts:130`; `server/src/modules/data-queries/util.service.ts:440`; `server/src/modules/session/util.service.ts:106` |
| Fix complexity | Medium |

**Impact:** Upstream REST responses can set arbitrary cookie names on the ToolJet origin, including `tj_auth_token`. If cookie forwarding is enabled, client cookies can also be sent to arbitrary upstreams with only a narrow prefix filter.

**Reproduction summary:** Point a REST datasource at an attacker endpoint that returns `Set-Cookie: tj_auth_token=...` and inspect ToolJet's response cookie.

**Recommended fix:** Do not forward browser cookies to arbitrary datasource hosts by default, block every ToolJet-reserved cookie name in both directions, and allow cookie bridging only for explicitly trusted same-site hosts.

### TJ-011 - Stored comment mention rendering XSS

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | XSS / CWE-79 |
| Affected code | `frontend/src`, comment mention rendering helpers, notification rendering components |
| Fix complexity | Small |

**Impact:** Comment text is stored user input. Mention highlighting returns HTML that is rendered with `dangerouslySetInnerHTML` without final escaping or sanitization, allowing stored XSS against workspace users.

**Reproduction summary:** Create a comment containing HTML or script-bearing payload around mention syntax and view the comment, comment notification, or notification center.

**Recommended fix:** Render mentions as React nodes instead of HTML strings, or sanitize after all mention highlighting transformations.

### TJ-012 - Table and highlighted-cell rendering can inject unsanitized HTML

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | XSS / CWE-79 |
| Affected code | `frontend/src`, table string column and highlighted-cell renderers |
| Fix complexity | Medium |

**Impact:** Editable string cells and highlighted-cell paths can pass datasource values through `dangerouslySetInnerHTML` without sanitizing after transformations. Query results or editable table values can become XSS payloads.

**Reproduction summary:** Return HTML from a datasource into an editable string column or highlighted table cell and observe browser rendering behavior.

**Recommended fix:** Prefer text nodes for string columns and sanitize every value after all highlighting or formatting steps, immediately before HTML insertion.

### TJ-013 - Credentialed CORS reflection and embed cookies enable cross-origin authenticated access

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | CORS / CSRF / CWE-942 |
| Affected code | `server/src/helpers/bootstrap.helper.ts:222`; `server/src/modules/session/util.service.ts:106` |
| Fix complexity | Medium |

**Impact:** `ENABLE_CORS=true` reflects arbitrary origins while allowing credentials. Private app embed mode sets auth cookies to `SameSite=None`, and no general CSRF token layer was found. Hostile origins can issue credentialed requests and, with reflected CORS, read responses.

**Reproduction summary:** Enable CORS reflection, then from a separate origin issue `fetch()` with `credentials: "include"` to a ToolJet API endpoint and inspect the CORS response.

**Recommended fix:** Replace reflected CORS with an explicit origin allowlist, enforce CSRF tokens or strict origin checks for cookie-authenticated mutations, and scope embed mode narrowly.

### TJ-014 - File UUID lookup lacks tenant or ownership scope

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | Authorization / CWE-639 |
| Affected code | `server/src/modules/files/repository.ts:21`; `server/src/modules/files/service.ts:10` |
| Fix complexity | Medium |

**Impact:** Authenticated users can fetch a file by UUID without an organization or ownership predicate. If a UUID leaks through app definitions, exports, logs, or references, file bytes can be read across tenant boundaries.

**Reproduction summary:** Authenticate as a user in one organization and request a known file UUID from another organization.

**Recommended fix:** Add ownership and organization metadata to file records or authorize through the resource that references the file before serving bytes.

### TJ-015 - gRPC proto directory validation warns but still reads outside allowed roots

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | File Access / CWE-22 |
| Affected code | `plugins/packages/grpcv2/lib/operations.ts`, gRPC datasource filesystem validation helpers |
| Fix complexity | Medium |

**Impact:** A builder-controlled gRPC datasource directory can point outside expected project or home roots. The server warns but continues scanning and reading proto files from readable filesystem paths.

**Reproduction summary:** Configure a gRPC datasource with an absolute or outside-root proto directory and observe the warning followed by file scanning.

**Recommended fix:** Reject absolute or outside-root paths, enforce an allowlisted proto root, and avoid returning or logging sensitive filesystem details.

### TJ-016 - Editors can publish apps and change public slugs

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | Authorization / CWE-862 |
| Affected code | `server/src/modules/apps/ability/app.ability.ts:81`; `server/src/modules/apps/controller.ts`; `server/src/entities/app.entity.ts` |
| Fix complexity | Medium |

**Impact:** Users who can edit an app can toggle public access and alter the globally unique slug. This can expose apps anonymously and allow slug squatting.

**Reproduction summary:** Assign an editor role, call the public-app update endpoint, and verify the app is reachable without authentication.

**Recommended fix:** Split publish and slug management into separate admin-controlled permissions and add audit events for public exposure changes.

### TJ-017 - Frontend sanitizer, PDF, and editor dependencies remain vulnerable in rendered surfaces

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | Vulnerable Dependency / CWE-1104 |
| Affected code | `frontend/package.json`; `frontend/package-lock.json` |
| Fix complexity | Medium |

**Impact:** Vulnerable versions of DOMPurify, jsPDF, jspdf-autotable, Draft.js, and immutable are used in user-rendered HTML, rich text, and PDF export surfaces. Exploitation depends on browser payloads but would be amplified by the permissive CSP.

**Reproduction summary:** Review the frontend lockfile and callsites for DOMPurify, PDF export, and Draft.js editor rendering.

**Recommended fix:** Upgrade DOMPurify, jsPDF, jspdf-autotable, and immutable; plan a Draft.js replacement or isolation; add rendering and export regression tests.

### TJ-018 - Server and plugin outbound dependencies expose SSRF, XML, and command-injection risk

| Field | Detail |
|---|---|
| Severity | High |
| Status | Likely |
| Type / CWE | Vulnerable Dependency / CWE-1104 |
| Affected code | `server/package.json`; `server/package-lock.json`; `plugins/package-lock.json`; `marketplace/package-lock.json` |
| Fix complexity | Medium |

**Impact:** Vulnerable versions of plugin-side axios, AWS SDK XML builder chains, and the pinned `systeminformation` override can affect server-side outbound connectors and OpenTelemetry host metrics. Risks include SSRF/metadata exposure, XML parser issues, and conditional command injection.

**Reproduction summary:** Inspect lockfiles and reachable imports for plugin axios, AWS SDK clients, and `nestjs-otel` host metrics with `systeminformation`.

**Recommended fix:** Add axios and AWS SDK overrides or lockfile upgrades, update or remove the `systeminformation` override, and test connector and OTel smoke paths.

### TJ-019 - Reset and invitation tokens are plaintext, unexpired, and weakly throttled

| Field | Detail |
|---|---|
| Severity | High |
| Status | Confirmed |
| Type / CWE | Token Management / CWE-256 |
| Affected code | `server/src/modules/auth/service.ts:215`; `server/src/modules/onboarding/service.ts:398`; `server/src/modules/auth/controller.ts`; `server/src/entities/user.entity.ts`; `server/src/entities/organization_user.entity.ts` |
| Fix complexity | Medium |

**Impact:** Password reset and invitation tokens are stored in plaintext with no expiry enforcement. A database snapshot or log exposure can yield working reset and invite links indefinitely, and pending invites can survive inviter demotion.

**Reproduction summary:** Issue a reset or invite token, inspect storage, wait beyond a normal expiry window, and redeem the token.

**Recommended fix:** Store only token hashes, add expiry columns and checks, rate-limit issuance and redemption, and revalidate inviter authority at invite acceptance.

### TJ-020 - Workflow webhook tokens are plaintext and replayable

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Confirmed |
| Type / CWE | Token Management / CWE-256 |
| Affected code | `server/src/entities/app.entity.ts`; `server/src/modules/licensing/guards/webhook.guard.ts:27`; `server/src/modules/licensing/guards/webhook.guard.ts:113` |
| Fix complexity | Medium |

**Impact:** Workflow API tokens are stored plaintext and compared directly. Captured requests can be replayed because there is no nonce, timestamp, HMAC, or replay cache.

**Reproduction summary:** Capture a valid workflow trigger request and replay it, or inspect the `apps.workflow_api_token` column and guard comparison.

**Recommended fix:** Hash workflow tokens at rest, compare fixed-length hashes with `timingSafeEqual`, add rotation, and support HMAC timestamp and nonce replay protection.

### TJ-021 - Folder update is not scoped by organization

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Confirmed |
| Type / CWE | Authorization / CWE-639 |
| Affected code | `server/src/modules/folders/service.ts:37` |
| Fix complexity | Small |

**Impact:** Folder update filters by ID only, unlike deletion which includes `organizationId`. A user with folder update permission and a foreign folder UUID can rename another tenant's folder.

**Reproduction summary:** Seed two organizations, learn a folder UUID from one, and call the update route from the other.

**Recommended fix:** Add `organizationId` to the update predicate and add a regression test comparing update and delete scoping.

### TJ-022 - Data-source update audit metadata can retain plaintext credentials

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Confirmed |
| Type / CWE | Sensitive Data Exposure / CWE-532 |
| Affected code | `server/src/modules/data-sources/service.ts:140`; `server/src/entities/audit_log.entity.ts` |
| Fix complexity | Small |

**Impact:** Datasource update audit metadata can include the plaintext update DTO before sensitive options are encrypted for storage. Audit-log readers or exports can receive datasource credentials.

**Reproduction summary:** Update a datasource password, then inspect the corresponding audit log metadata for the submitted value.

**Recommended fix:** Redact sensitive option keys before setting audit metadata and add tests for credential updates.

### TJ-023 - Telemetry and HTTP error logging can expose PII or upstream secrets

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Confirmed |
| Type / CWE | Logging / CWE-532 |
| Affected code | `server/src`, Sentry initialization, REST and OpenAPI connector error handlers |
| Fix complexity | Medium |

**Impact:** Sentry is configured with default PII and full tracing, custom spans can include request bodies, and REST/OpenAPI error handlers log upstream bodies or full error objects. Secrets can leak into logs and third-party telemetry.

**Reproduction summary:** Trigger REST/OpenAPI upstream errors containing sensitive response bodies and inspect application logs and telemetry configuration.

**Recommended fix:** Disable default PII, redact request and response bodies, avoid logging full error objects, and log structured metadata only.

### TJ-024 - Reachable upload, email, and route parsing dependencies allow moderate DoS

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Likely |
| Type / CWE | Denial of Service / CWE-400 |
| Affected code | `server/package.json`; `server/package-lock.json`; `server/src/modules/profile/controller.ts`; `server/src/modules/tooljet-db/controller.ts`; `server/src/modules/organization-users/controller.ts`; `server/src/modules/email/util.service.ts` |
| Fix complexity | Medium |

**Impact:** Vulnerable versions of multer, nodemailer, path-to-regexp, and Nest core sit on reachable upload, email, and route parsing paths. The likely practical impact is request-driven resource exhaustion.

**Reproduction summary:** Review lockfile versions and reachable `FileInterceptor`, `sendMail`, and parameterized Nest route callsites.

**Recommended fix:** Upgrade Nest packages and multer, move nodemailer to a fixed major version after API review, and add route or endpoint-level throttles.

### TJ-025 - Global request body and parameter limits are overly large

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Likely |
| Type / CWE | Denial of Service / CWE-400 |
| Affected code | `server/src/helpers/bootstrap.helper.ts` |
| Fix complexity | Small |

**Impact:** The server accepts large JSON bodies and a very high URL-encoded parameter count. Public or unauthenticated endpoints can be used for moderate resource exhaustion.

**Reproduction summary:** Inspect global body parser limits and drive large JSON or URL-encoded requests at public endpoints.

**Recommended fix:** Lower global limits, set endpoint-specific upload limits, and throttle public auth, import, and upload routes.

### TJ-026 - Constants and secrets regex can overmatch server-side substitutions

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Likely |
| Type / CWE | Information Disclosure / CWE-200 |
| Affected code | `server/src/modules/data-sources/util.service.ts` |
| Fix complexity | Small |

**Impact:** The constants/secrets/globals regex has incorrect alternation precedence and can trigger broader server-side resolution than intended, potentially exposing tenant-scoped constants or secrets in connector execution.

**Reproduction summary:** Review the matcher and test template values that include `constants`, `secrets`, or `globals.server` variants.

**Recommended fix:** Replace the matcher with a grouped expression such as `/{{(?:constants|secrets|globals\\.server)\\.[^}]+}}/g` and add unit tests for non-matching variants.

### TJ-027 - Deployment defaults and missing secret validation can expose self-hosted instances

| Field | Detail |
|---|---|
| Severity | Medium |
| Status | Likely |
| Type / CWE | Configuration / CWE-798 |
| Affected code | `.env.example`; `server/src/modules/app/module.ts`; server startup configuration |
| Fix complexity | Medium |

**Impact:** Example and runtime configuration allow weak or missing secrets such as an all-zero `LOCKBOX_MASTER_KEY`, empty `PGRST_JWT_SECRET`, and missing queue dashboard password. Self-hosted deployments that copy defaults can expose credentials or job payloads.

**Reproduction summary:** Start from example configuration with weak or unset secrets and inspect application startup, credential encryption, PostgREST signing, and `/jobs` dashboard behavior.

**Recommended fix:** Fail startup on missing or known-default secrets, generate install-time secrets, and disable privileged dashboards unless a strong password is configured.

### TJ-028 - Auth cookie `Secure` flag depends on `TOOLJET_HOST` string parsing

| Field | Detail |
|---|---|
| Severity | Low |
| Status | Likely |
| Type / CWE | Cookie Hardening / CWE-614 |
| Affected code | `server/src/helpers/utils.helper.ts`; `server/src/modules/session/util.service.ts:113` |
| Fix complexity | Small |

**Impact:** TLS-terminating proxy deployments can accidentally issue non-secure auth cookies if `TOOLJET_HOST` is set to an internal HTTP URL.

**Reproduction summary:** Run behind a TLS proxy with `TOOLJET_HOST=http://...` and inspect `Set-Cookie` attributes.

**Recommended fix:** Add explicit `COOKIE_SECURE=true` and trusted proxy configuration rather than deriving cookie security solely from public host string parsing.

### TJ-029 - Permissive CSP weakens XSS containment

| Field | Detail |
|---|---|
| Severity | Low |
| Status | Confirmed |
| Type / CWE | Hardening / CWE-693 |
| Affected code | `server/src/helpers/bootstrap.helper.ts` |
| Fix complexity | Medium |

**Impact:** CSP allows inline script, eval, broad connections, and broad frames. This does not create XSS by itself but substantially weakens containment for confirmed and likely XSS issues.

**Reproduction summary:** Inspect the CSP directives configured at server bootstrap.

**Recommended fix:** Remove `unsafe-inline` and `unsafe-eval`, add nonces or hashes where needed, narrow `connect-src`, and set `frame-ancestors` from explicit embed settings.

### TJ-030 - Build-time supply-chain and EOL dependency hygiene risk remains

| Field | Detail |
|---|---|
| Severity | Low |
| Status | Likely |
| Type / CWE | Supply Chain / CWE-1104 |
| Affected code | `server/package.json`; `server/package-lock.json`; `frontend/package-lock.json`; `plugins/package-lock.json`; `marketplace/package-lock.json` |
| Fix complexity | Medium |

**Impact:** Build-time and deprecated dependency chains such as bcrypt/node-pre-gyp, abandoned frontend libraries, older Lerna/Nx chains, and other EOL packages increase maintenance and supply-chain risk, especially for self-hosted builds that run installs on production hosts.

**Reproduction summary:** Review dependency audit output, deprecated package metadata, and install-script inventory.

**Recommended fix:** Upgrade bcrypt, replace abandoned libraries, remove unused direct dependencies, and fail CI on newly introduced critical or high runtime advisories.

## 4. Dependency Security

### Actionable Runtime Fixes

| Area | Action | Reachability note |
|---|---|---|
| Frontend rendered surfaces | Upgrade DOMPurify, jsPDF, jspdf-autotable, immutable, and plan Draft.js replacement or isolation. | Likely reachable through rendered HTML, rich-text, and PDF export paths. Impact is amplified by permissive CSP. |
| Server/plugin outbound paths | Upgrade or override plugin-side axios, AWS SDK v3 chains, and remove or update the pinned `systeminformation` override. | Relevant to outbound connectors, AWS-backed plugin operations, and OTel host metrics when enabled. |
| Upload/email/routing DoS | Upgrade Nest packages, `path-to-regexp`, `multer`, and review the nodemailer major upgrade path. | Upload interceptors, unauthenticated email flows, and broad parameterized routes are request-adjacent. |
| Deployment and build supply chain | Upgrade bcrypt, replace abandoned libraries, remove unused direct dependencies, and modernize Lerna/Nx chains. | Primarily build-time/self-hosted install exposure, not a live request-path issue. |

### Reachability Notes and Lower-Priority Scanner Output

The audit deliberately did not preserve every raw critical scanner finding as a customer-facing vulnerability. `simple-git` was present but had no CE callsite. `protobuf.parse()` was reachable only on server-side proto files, not request-supplied proto text in the validated CE paths. Handlebars templates were server-controlled. SAML-related `node-forge` and `xmldom` advisories were not reachable in the CE source because the relevant EE/SAML paths are absent or not implemented. These items remain useful cleanup targets, but they were not counted in the 30 retained findings.

## 5. Remediation Roadmap

### Immediate: 0-7 Days

Fix `TJ-001` through `TJ-003`. Require valid SCIM secrets at startup and strict bearer parsing, remove or disable arbitrary GitHub `repo` plugin installation in production while designing signed/out-of-process plugin execution, and require password verification or a signed expiring invite proof in the invitation login branch.

### Next Sprint: 1-3 Weeks

Fix `TJ-004` through `TJ-019`. Prioritize tenant scoping on datasource and file lookups, public-app authorization allowlists, OAuth state validation, connector SSRF and injection controls, REST cookie bridging restrictions, comment/table XSS fixes, high-impact dependency upgrades, reset/invite token storage, and app publishing permission separation.

### Hardening Backlog: 30-60 Days and Ongoing

Fix `TJ-020` through `TJ-030`. Hash and rotate workflow webhook tokens, redact audit metadata and telemetry/log output, lower parser limits, correct constants/secrets matching, enforce strong deployment secret validation, add explicit secure-cookie configuration, tighten CSP, and reduce build-time/EOL dependency exposure.

## 6. Disclosure and Issue Filing Plan

The configured severity threshold in `FINDINGS.json` is `high`. Findings meeting that threshold are all Critical and High retained findings:

`TJ-001`, `TJ-002`, `TJ-003`, `TJ-004`, `TJ-005`, `TJ-006`, `TJ-007`, `TJ-008`, `TJ-009`, `TJ-010`, `TJ-011`, `TJ-012`, `TJ-013`, `TJ-014`, `TJ-015`, `TJ-016`, `TJ-017`, `TJ-018`, and `TJ-019`.

Recommended filing order:

| Filing group | Findings | Rationale |
|---|---|---|
| Critical security issues | `TJ-001` to `TJ-003` | Direct authentication bypass or host code execution. File and patch immediately. |
| Tenant and network boundary issues | `TJ-004`, `TJ-005`, `TJ-008`, `TJ-009`, `TJ-014`, `TJ-015` | Cross-tenant, SSRF, credential-target redirection, and filesystem/file access risks. |
| Browser/session compromise | `TJ-010`, `TJ-011`, `TJ-012`, `TJ-013`, `TJ-029` | Session fixation, stored XSS, cross-origin credentialed access, and CSP containment weakness. |
| Auth and token hygiene | `TJ-006`, `TJ-019`, plus `TJ-020` as follow-up | OAuth state, reset/invite token storage, and webhook token replay. |
| Dependency remediation | `TJ-017`, `TJ-018`, `TJ-024`, `TJ-030` | Track as security upgrade epics with regression tests and lockfile PRs. |

No issue or PR URLs were present in `VALIDATION.md`, `DEP_AUDIT.md`, `CODE_REVIEW.md`, or `FINDINGS.json`; `issue_url` and `pr_url` are blank for all findings.

## 7. Appendices

### Appendix A - Commands Run

Representative commands and tools recorded in the source artifacts:

```bash
npm audit --json --package-lock-only
jq '.metadata.vulnerabilities' <audit-json>
jq '.packages[] | select(.deprecated)' package-lock.json
jq '.packages[] | select(.hasInstallScript)' package-lock.json
semgrep scan \
  --config=p/owasp-top-ten --config=p/typescript --config=p/javascript \
  --config=p/nodejsscan --config=p/security-audit \
  --json --output=sast-raw.json --metrics=off --no-git-ignore --quiet \
  --exclude='node_modules' --exclude='*.test.ts' --exclude='*.spec.ts' \
  --exclude='cypress-tests' --exclude='dist' --exclude='build' --exclude='.git' \
  --exclude='frontend/build' --exclude='**/migrations/**' \
  server plugins
rg 'knex.raw|sequelize|\.query\(`' server plugins
rg 'child_process|execSync|spawn' server plugins
rg 'eval\(|new Function\(|vm.run|isolated-vm' server plugins frontend/src
rg 'got\(|axios|http.request|fetch\(' server plugins
rg 'dangerouslySetInnerHTML|innerHTML =|\.html\(' frontend/src
```

This deliverable also re-read `FINDINGS.json` and compared its severity/status counts with `TRIAGE.md` before finalization.

### Appendix B - Artifacts Produced or Reviewed

Reviewed artifacts:

- `RECON.md`
- `DEP_AUDIT.md`
- `SAST.md`
- `CODE_REVIEW.md`
- `VALIDATION.md`
- `TRIAGE.md`
- `EXECUTIVE_SUMMARY.md`
- `FINDINGS.json`
- `sast-raw.json`
- `semgrep-stderr.log`

Produced artifacts:

- `REPORT.md`
- `REPORT.html`
- `REPORT.pdf` if local PDF tooling succeeds

### Appendix C - False-Positive Handling

False positives and unlikely items were excluded when the vulnerable package or pattern had no CE callsite, was limited to operator-only scripts, was mitigated by framework behavior, or depended on absent EE source. Examples include unused direct `simple-git`, unused direct `fast-xml-parser`, SAML-only XML/PKI dependency paths in CE, test-only credentials, operator-controlled log paths, and the `eval()` log-rotation candidate where request-controlled strings did not produce a practical escape.

Dependency findings were retained only when the vulnerable package sat on a rendered user surface, request-adjacent server path, outbound connector path, OTel host metrics path, or self-hosted build/install path with realistic operator exposure.

### Appendix D - Assumptions

- CE source in this checkout is representative of the audited target at commit `8ce1dcca884601405c26f4e049cda27e68dfb5d0`.
- EE-only code absent from `server/ee/` requires separate review before claims are extended to EE/Cloud behavior.
- Workspace builders and admins may not be fully trusted in self-hosted multi-tenant deployments; if the customer treats them as host operators, the severity of plugin-install RCE changes.
- Public apps may be reachable by unauthenticated users and may execute configured datasource queries.
- Outbound egress restrictions, CORS/embed settings, REST cookie forwarding, audit-log reader roles, and deployment secret generation vary by customer deployment and can materially change exploitability.
- Severity and counts are sourced from `TRIAGE.md` and `FINDINGS.json`; the final retained set is 30 findings, with 3 Critical, 16 High, 8 Medium, and 3 Low.
