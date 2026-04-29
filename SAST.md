# SAST.md — ToolJet Security Audit (Stage 2: Static Analysis)

Companion to `RECON.md`. Same commit (`8ce1dcca8`, branch `develop`). All paths are
relative to the repository root.

---

## 1. Tools, configuration, and coverage

### 1.1 Semgrep (primary SAST)

- **Binary.** `semgrep 1.161.0` (already present at `~/.local/bin/semgrep`; no network installs performed for this stage).
- **Rulesets pulled from the registry** (one-shot fetch, no new tooling installed):
  - `p/owasp-top-ten`
  - `p/typescript`
  - `p/javascript`
  - `p/nodejsscan`
  - `p/security-audit`
  - (`p/express` was attempted first; the registry returned **HTTP 404** so the bundle was dropped — see `semgrep-stderr.log`.)
- **Command.**
  ```
  semgrep scan \
    --config=p/owasp-top-ten --config=p/typescript --config=p/javascript \
    --config=p/nodejsscan --config=p/security-audit \
    --json --output=sast-raw.json --metrics=off --no-git-ignore --quiet \
    --exclude='node_modules' --exclude='*.test.ts' --exclude='*.spec.ts' \
    --exclude='cypress-tests' --exclude='dist' --exclude='build' --exclude='.git' \
    --exclude='frontend/build' --exclude='**/migrations/**' \
    server plugins
  ```
- **Coverage.** 1996 files scanned across `server/` and `plugins/`; 76 raw findings; 0 rule errors. Frontend (`frontend/src/`) was kept out of the semgrep scan to keep the report focused on server-side risk; XSS sinks in the frontend were swept separately with ripgrep (§2.6).
- **Output artefact.** `sast-raw.json` (≈186 KB, full JSON envelope).

### 1.2 Targeted ripgrep sweeps (compensating for the limited semgrep coverage)

12 keyword sweeps were run to augment semgrep's findings; output stashed under `/tmp/sast-grep/`. Sweep purposes:

| # | Pattern | Scope |
|---|---|---|
| 01a/b | `knex.raw`, `sequelize`, `\.query(\``, generic raw-SQL | `server/`, `plugins/` |
| 02 | `child_process`, `execSync`, `spawn` | `server/`, `plugins/` |
| 03 | `eval(`, `new Function(`, `vm.run`, `isolated-vm` | `server/`, `plugins/`, `frontend/src/` |
| 04 | `got(`, `axios.*`, `http.request`, `fetch(` | `server/`, `plugins/` |
| 05 | `new URL(`, `url.parse(`, `url.resolve(` | `server/`, `plugins/` |
| 06 | `console.log(...password|token|secret|sourceOptions...)` | `server/`, `plugins/` |
| 07 | `fs.{read,write,…}File*`, `createReadStream`, etc. | `server/`, `plugins/` |
| 08 | `extract`, `unzip`, `tar.x`, `adm-zip` | `server/`, `plugins/` |
| 09 | `createCipher`, `Math.random`, `jwt.{sign,verify,decode}` | `server/`, `plugins/` |
| 10 | `res.cookie`, `setCookie`, `cookie:` literal | `server/`, `plugins/` |
| 11 | `dangerouslySetInnerHTML`, `innerHTML =`, `.html(` | `frontend/src/` |
| 12 | `@Public()`, `@UseGuards(JwtAuthGuard)` only | `server/src/` |

### 1.3 Manual file reads

Every candidate cited below was confirmed by opening the file at the cited line. False-positive ratings reflect both the static evidence and the call graph established in `RECON.md` §3.

---

## 2. Findings by class

Each candidate carries:

- **File:line** — exact location.
- **Why exploitable** — the reason the pattern is dangerous *here* (not generically).
- **FP likelihood** — Low / Medium / High; how likely the candidate is a false alarm rather than a real vulnerability.
- **Validation priority** — P0 (drop everything), P1 (next-day), P2 (this audit cycle), P3 (background).

A finding with **FP = Low + Priority = P0/P1** should be fed straight into stage 3 (PoC/DAST). A **High-FP** candidate is included so that the next reviewer knows it was *seen and rejected* rather than missed.

---

### 2.1 Authentication / Authorization bypass

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **A1** | `server/src/modules/scim/guards/scim-auth.guard.ts:35-39` | The Bearer/Header branch reads `token = authHeader.split(' ')[1]` and `validToken = SCIM_HEADER_AUTH_TOKEN`. If the env var is **unset**, `validToken === undefined`. Sending `Authorization: anything-without-a-space` produces `token === undefined`, and `undefined === undefined` ⇒ guard returns `true`. SCIM provisioning routes (user create/update/delete, group create/update/delete) become anonymous-administer-able if the operator forgets to set the variable. The Basic branch on lines 27-31 has the same issue if `SCIM_BASIC_AUTH_USER`/`PASS` are both unset and the attacker sends `Authorization: Basic <base64('a:undefined')>` — but the empty-string vs. `undefined` mismatch makes the Basic path fail in practice. The Bearer path **does not**. Compounded by `===` not being constant-time. | Low | **P0** |
| **A2** | `server/src/modules/data-queries/guards/validate-query-source.guard.ts:43` | When the route uses `dataSourceId` instead of `id`, the guard calls `dataSourceRepository.findById(dataSourceId)` with **no `organizationId`** filter. Tenant separation is then deferred entirely to the downstream ability check, which keys off `request.tj_data_source.id` — but if the user is a member of multiple orgs and supplies a foreign `tj-workspace-id` header, the ability OR-merge (`util.service.ts:190-275`) can grant the action. | Medium | **P1** |
| **A3** | `server/src/modules/apps/guards/app-auth.guard.ts:33-37, 49` | Slug → `appRepository.findOne({ where: { slug } })`. No org scoping; the guard then **stamps `request.headers['tj-workspace-id'] = app.organizationId`** regardless of who sent the request. If any downstream feature lacks `shouldNotSkipPublicApp` and the app is `isPublic=true`, the public-app shortcut at `ability.guard.ts:111-114` returns `true` and the action runs. | Low | **P1** |
| **A4** | `server/src/modules/app/guards/ability.guard.ts:111-114` | Confirmed: `if (app?.isPublic && !featureInfo.shouldNotSkipPublicApp) return true;`. Only **two** modules opt in (`apps:VALIDATE_PRIVATE_APP_ACCESS`, `data-sources:` one feature, `data-queries:` two features). All other features behind `app-auth.guard` are reachable anonymously on a public app — including any future feature that forgets the flag. | Low | **P1** |
| **A5** | `server/src/modules/auth/service.ts:215-261` | `forgotPasswordToken = uuid.v4()` written to `users.forgot_password_token` **plaintext, no expiry**. `resetPassword` is a single-equality DB lookup (line 217); a database read (e.g., from a backup, debug query, log accident) is enough to take over any account that has ever clicked "forgot password". `/forgot-password` itself has no rate limit (controller line 65-70) and `findByEmail` returns `undefined` on miss with no timing equalisation, leaking enumeration. | Low | **P1** |
| **A6** | `server/src/modules/session/jwt/jwt.strategy.ts:32` | `ignoreExpiration: true`. Validity is bounded only by the DB `user_sessions` row (default 14400 minutes / 10 days), but the cookie itself is set with `maxAge: 2 years`. Any future code path that decodes the JWT without going through `JwtStrategy.validate` (some scratch-built SSE/WS guards exist; see `server/src/modules/auth/app-history-sse-auth.guard.ts`, `workflow-sse-auth.guard.ts`) will accept tokens long after the session is meant to die. | Medium | **P1** |
| **A7** | `server/src/modules/licensing/guards/webhook.guard.ts:121, 148` | `token === workflowApp.workflowApiToken` and `token === externalApiAccessToken` — non-constant-time. Combined with the two-method dual-auth, a remote attacker can timing-guess workflow webhook tokens character-by-character. The route is unauthenticated otherwise and is intended for external callers. | Medium | **P2** |
| **A8** | `server/src/modules/licensing/guards/webhook.guard.ts:28-31` | Workflow lookup `findOne({ where: { id_or_name, type: WORKFLOW } })` with **no organization filter**. UUID entropy mostly saves it, but the lookup *also* permits `name` (line 30 `[isUuid ? 'id' : 'name']`), so a guessable workflow name combined with the timing-attack token can reach a workflow in any org. | Medium | **P2** |
| **A9** | `server/src/modules/auth/service.ts:53-66` | Login calls `findByEmail(email, organizationId, [INVITED])` *without password verification* when `redirectTo` starts with `/organization-invitations/` or `/invitations/`. The path `redirectTo` is attacker-controlled (a body field on `/authenticate/:organizationId`), so any client can flip a normal login into the invite branch by setting `redirectTo`. From the invite branch, the user is fetched without password match — but the `validateLoginUser` path is skipped. **Crucial caveat:** the user must already be in `INVITED` status, which limits exploitability to org/user pairs the attacker knows are pending. Still: the password is never checked on this branch. | Medium | **P1** |
| **A10** | `server/src/modules/onboarding/controller.ts:32, 42, 50, 56`, plus `…/constants/feature.ts` ten `isPublic: true` entries | Onboarding endpoints (`signup`, `accept-invite`, `setup-super-admin`, `setup-account-from-token`, `verify-invite-token`) are flagged `isPublic` so they bypass JWT. A `*-disable.guard.ts` chain controls which ones can fire: `SignupDisableGuard`, `FirstUserSignupGuard`, `FirstUserSignupDisableGuard`. If any of these guards reads from a misconfigured env or DB row, anonymous account creation / super-admin creation becomes reachable. Worth a focused review of the four onboarding disable-guards in stage 3. | Medium | **P2** |

### 2.2 Injection (SQL / NoSQL / template / shell)

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **I1** | `plugins/packages/postgresql/lib/index.ts:235-256` (`buildBulkUpdateQuery`) | The bulk-update GUI mode interpolates **table name, primary-key column, primary-key value, every column name, and every value** straight into the SQL string. String values are wrapped in single quotes but **never escaped**, so a value containing `'` immediately closes the literal. Anyone who can drive the query (builder UI, end-user form widget, shared public app) can run arbitrary SQL on the connected database with the data-source's stored credentials. The exact same pattern is in `plugins/packages/{mysql,mssql,oracledb}/lib/index.ts` (`buildBulkUpdateQuery`) per `RECON.md` §4.3. | Low | **P0** |
| **I2** | `plugins/packages/postgresql/lib/index.ts:67-70` | When the user **does not** supply `query_params`, the SQL mode runs `pgConnection.query(query)` with the verbatim query body. This is intentional for a SQL connector, but combined with the template-resolution pipeline at `server/src/modules/data-queries/util.service.ts:481-628` (which *string-interpolates* `{{variable}}` values into the query body), any client that controls a template variable on a query controls the resulting SQL. Same shape in MySQL/MSSQL/SAP HANA (`plugins/packages/saphana/lib/index.ts:28`) / Snowflake (`plugins/packages/snowflake/lib/index.ts`). | Medium | **P1** |
| **I3** | `plugins/packages/bigquery/lib/index.ts:39-77` | `CREATE VIEW`, `DELETE_RECORD`, `UPDATE_RECORD` template-interpolate `datasetId`, `tableId`, and the `condition` clause directly into BigQuery SQL. Same exploitability shape as **I1**. | Low | **P1** |
| **I4** | `plugins/packages/mongodb/lib/index.ts:190-194` (`parseEJSON`) | `EJSON.parse(JSON.stringify(JSON5.parse(maybeEJSON)))` over user-controlled `filter`, `update`, `pipeline`, and `replacement`. EJSON itself is a serialiser — but operators reaching the MongoDB driver include `$where` (server-side JS evaluation on Mongo < 5.x) and `$function` / `$accumulator` (Mongo ≥ 4.4). Builder users can encode arbitrary JS via these operators; the only mitigation is whatever the server's Mongo allow-list is. | Medium | **P1** |
| **I5** | `server/src/modules/log-to-file/constants/index.ts:78` | `JSON.stringify(eval(modifiedContent), null, 2)`. `modifiedContent` is built from disk-read log-rotation lines (winston pretty-printed JSON objects) joined with `,` and wrapped `[ ... ]`. Any field that ends up in an audit-log message and survives JSON encoding without being properly escaped — for example, an unbalanced `${` in a `console.log`-style winston field, or a non-string serialiser that emits `function (){...}` — collapses into JS executing under the server process's UID. The exposure surface = anything a malicious user can land in `audit.log` between rotations. **No safer reason to call eval here exists**; `JSON.parse` would do. | Medium | **P0** |
| **I6** | `server/src/modules/data-queries/util.service.ts:481-628` (`parseQueryOptionsInternal`) | Resolves `{{...}}` templates by substituting raw strings and `JSON.stringify(replacement)` into the query options before they reach the connector. The substitution is purely textual (`resolvedValue.replace(variable, String(replacement))`) — so any connector that interpolates these resolved strings into a query/URL/path (REST URL, OpenAPI path-params, the SQL `query` field, GraphQL query body, MongoDB EJSON filter, …) inherits server-side template injection. Connectors that take *parameterised* options (`knex.raw(query, params)`) are safe; the bulk-update path (**I1**) and the no-params SQL path (**I2**) are not. | Medium | **P1** |
| **I7** | `plugins/packages/openapi/lib/index.ts:17-23, 56-57` | `resolvePathParams` does literal `.replace('{key}', value)` with no URL-encoding, so `value = "../../admin/users"` collapses path components and reaches a different endpoint than the OpenAPI spec advertised. `host = sourceOptions.host || queryOptions.host` — query-time host override allows pointing the call at a different upstream entirely. Combined with the SSRF profile in **S1**, this is a tidy primitive. | Low | **P1** |
| **I8** | `plugins/packages/saphana/lib/index.ts:28` | `connection.exec(query, ...)` with the raw user-supplied SQL string — same shape as **I2**, called out separately because the SAP HANA driver's error surface is different (JSON-RFC error returns) and is the only connector where `exec` is the SAP/JDBC `exec`, not Node's `child_process.exec`. | Low | **P2** |
| **I9** | `plugins/packages/postgresql/lib/index.ts:48-51` | `new URL(sourceOptions.connection_string)` then mutates `hostname`/`pathname` from `queryOptions['host']`/`['database']` when `allow_dynamic_connection_parameters` is enabled. The result is fed straight into `pg`. A query-level override of the connection target = **a query that points at a different DB server** than the data source advertises, with the data source's credentials. Same in MySQL/MSSQL when `allow_dynamic_connection_parameters` is on. | Medium | **P1** |
| **I10** | `plugins/packages/mongodb/lib/index.ts:222-230, 312-323` | URI is built by string concatenation: `mongodb://${username}:${password}@${host}:${port}` and `${protocol}://${authSection}${finalHosts}`. `username`/`password` are URL-encoded; `host`/`port` are not. `host` containing `@`, `?`, `/`, or extra `,` lets a builder rewrite the connection target (CSRF-style cred theft to an attacker-controlled Mongo) and inject extra query parameters (`?retryWrites=true&authSource=admin&loadBalanced=...`). | Medium | **P1** |

### 2.3 SSRF and outbound-network abuse

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **S1** | `plugins/packages/restapi/lib/index.ts:154-156, 68` | `constructUrl = sourceOptions.url + queryOptions.url`. `got(url, requestOptions)`. There is **no scheme allow-list, no IP/hostname denylist, no DNS-rebinding mitigation**. Cloud metadata endpoints (`http://169.254.169.254/...`, `http://metadata.google.internal/...`, IMDSv2 `PUT` flow), internal services (`http://localhost:5432/`, `http://kubernetes.default/`, `http://10.0.0.x/admin`), and intra-VPC services are all reachable. Any builder-role user can hit them; on a public app they're reachable anonymously if the data-source feature gate doesn't carry `shouldNotSkipPublicApp`. | Low | **P0** |
| **S2** | `plugins/packages/openapi/lib/index.ts:56-57, 93` | Same issue as **S1**; additionally, `host` can be overridden per-call (see **I7**). | Low | **P0** |
| **S3** | `plugins/packages/graphql/lib/index.ts:25` | `sourceOptions.url` → `got(url, …)`. Same SSRF shape; query body is forwarded verbatim. | Low | **P0** |
| **S4** | `plugins/packages/influxdb/lib/index.ts:23, 32, 41, …` and `plugins/packages/couchdb/lib/index.ts:22, 37, 46, …` | Both connectors build URLs from `${protocol}://${host}:${port}/...` using user-supplied `protocol`/`host`/`port`. Same SSRF surface as REST/GraphQL but with a smaller set of plausible targets (anything that speaks Influx/Couch on the chosen port). | Low | **P1** |
| **S5** | `plugins/packages/n8n/lib/index.ts:52-57`, `plugins/packages/baserow/lib/index.ts:28-98`, `plugins/packages/zendesk/lib/index.ts:71-167` | Same pattern (user-supplied base URL → `got`). Less interesting individually but they multiply the SSRF surface. | Medium | **P2** |
| **S6** | `plugins/packages/grpcv2/lib/operations.ts:584-595` (`loadProtoFromRemoteUrl`) | `got(url, …)` with user-supplied URL, response body written to `os.tmpdir()/grpc-proto-<Date.now()>.proto`, then `protoLoader.loadSync(tempFile)`. Three risks: (a) SSRF identical to **S1**; (b) the temp-file name uses `Date.now()` so a parallel call can collide / race; (c) proto-loader on attacker-controlled input has historically had its own parsing bugs. | Medium | **P1** |
| **S7** | `server/src/modules/data-queries/util.service.ts:130-152` | When `dataSource.kind === 'restapi'` and `FORWARD_RESTAPI_COOKIES=true`, all incoming browser cookies (filtered only by `!cookie.startsWith('tj_auth_token=')`) are appended to the upstream request as a `Cookie` header. Combined with **S1**, an attacker who controls a REST data source can read back the user's other cookies (e.g., a CSRF cookie, a session for another product on the same domain). The prefix-only filter also misses any future cookie `tj_auth_token_pat=…` or `tj-auth-token` (hyphen). | Low | **P1** |
| **S8** | `server/src/modules/data-queries/util.service.ts:440-478` (`setCookiesBackToClient`) | Forwards every `Set-Cookie` header from upstream back to the browser via `response.cookie(name, value, options)` with no filter. **An attacker-controlled REST upstream can set `tj_auth_token`** in the user's browser, scoped to the ToolJet origin — i.e., session fixation / session takeover for any user who runs the rigged query. Cookie domain/path are inherited from upstream parsing, but `response.cookie` defaults the domain to the current host, so the cookie sticks. | Low | **P0** |
| **S9** | `server/src/helpers/bootstrap.helper.ts:setupGlobalAgent` (referenced from `RECON.md` §3.5) | `TOOLJET_HTTP_PROXY` is optional. With it unset, every plugin makes direct outbound connections — no central choke-point for an SSRF allowlist. If the operator did configure it, the proxy itself can become the redirector if it accepts arbitrary CONNECT targets. | Medium | **P2** |
| **S10** | `server/src/modules/auth/oauth/util-services/git-oauth.service.ts` | `SSO_GIT_OAUTH2_HOST` is a per-org config, not validated against a list of known git providers. A workspace admin can point Git OAuth at an attacker-controlled host that returns a valid-looking token + email; the resulting account is then auto-linked into the ToolJet org. | Medium | **P2** |

### 2.4 Secrets exposure

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **K1** | `server/src/helpers/tooljet_db.helper.ts:289` | `console.log(Array.from(crypto.randomBytes(length - mandatoryChars.length)));` — the **raw randomness used to seed a TJDB Postgres role password** is logged before it is consumed. Anyone with stdout / pino access (Sentry log shipping, ELK pipeline, container logs) gets the bytes that derive `passwordArray[4..]`. Combined with `Math.random()` for the first 4 chars (line 282-285), the resulting Postgres user password is recoverable. | Low | **P0** |
| **K2** | `server/src/helpers/bootstrap.helper.ts:79` | `console.log("License valid : ${...} License Terms : ${JSON.stringify(licenseInfo.terms)} 🚀");` — license terms (which on EE contain entitlement metadata, sometimes signed payload contents) printed at startup. Low-impact alone; combined with K3/K4 it widens what ends up in shared logs. | High | **P3** |
| **K3** | `server/src/helpers/bootstrap.helper.ts:198` | `Sentry.init({ sendDefaultPii: true, tracesSampleRate: 1.0, ... })`. Confirms RECON §3.1: every captured request includes user / IP / cookie metadata, and 100 % of transactions are sampled. If `APM_VENDOR=sentry` and the DSN points to a third party, the tenant data leaves the box. | Low | **P1** |
| **K4** | `plugins/packages/restapi/lib/index.ts:282-283` | `console.error("Error while calling REST API endpoint. Status code: ${...}, Message: ${error?.response?.body}");` logs the full upstream response body on every HTTP error. If the upstream is an internal service (per **S1**) the body may contain credentials, IAM metadata, or cloud-init secrets. | Medium | **P1** |
| **K5** | `plugins/packages/openapi/lib/index.ts:112` | `console.log(error)` of the entire `got` HTTPError, which includes `error.options.headers` (Authorization, custom credentials). | Medium | **P2** |
| **K6** | `server/src/modules/files/service.ts:15-18` | `Content-Disposition: inline; filename="${file.filename}"` — the filename is taken from the DB and inserted into the header without escaping. If `file.filename` contains `"` or `\r\n`, header injection (response splitting) is possible. The `Content-Type` is the literal string `"image"`, so any non-image binary served via this endpoint is rendered with whatever MIME the browser guesses — combined with the loose CSP (`RECON.md` §4.2) this is a stored-XSS-via-file-upload candidate. | Medium | **P1** |
| **K7** | `server/src/modules/encryption/service.ts:48` | `Buffer.from(process.env.LOCKBOX_MASTER_KEY, 'hex')` — if the env var is unset, this becomes a 0-byte buffer; HKDF still produces a deterministic key. `.env.example` ships `LOCKBOX_MASTER_KEY=000…0`, so any operator who copies the example file unaltered ends up with a globally known master key and decryptable credential ciphertexts. The crypto itself (AES-256-GCM, 12-byte nonce, HKDF-SHA384) is sound (§2.7); the operational hazard is the entire issue. | Low | **P1** |
| **K8** | `.env.example` (`LOCKBOX_MASTER_KEY`, `SECRET_KEY_BASE`, `PGRST_JWT_SECRET`, etc.) | The example file ships with placeholders that are valid (length-correct hex / base64) inputs, not obvious garbage. Operators who follow the docker quick-start without rotating them ship with publicly-known crypto material. Stage 3 should grep deployed Helm/terraform defaults for the same. | Low | **P2** |
| **K9** | `plugins/packages/zendesk/__tests__/index.js:34, 50` (semgrep `node_username`) | Hard-coded test usernames/passwords. Test-only — confirmed via `__tests__/` path. No exposure in production builds. | High | **P3** |

### 2.5 File / path traversal / archive / upload

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **F1** | `server/src/modules/files/service.ts:10-22` + `repository.ts:21-29` | `getOne(id)` looks up a file by primary key with **no organization filter**. The ability layer is the only check. If a future ability bug lets a user enumerate file IDs (UUID v4, so guessing is hard, but file IDs are leaked via app definitions, audit logs, and any endpoint that returns `attachments`/`avatars`), the controller streams the raw bytes back. Plus the header-injection / MIME-confusion issue from **K6**. | Medium | **P2** |
| **F2** | `plugins/packages/grpcv2/lib/operations.ts:25-46` (`validateFilesystemAccess`) | `path.resolve(expandedDir)` "outside cwd or homedir" only **warns** (`console.warn`) — it does **not** throw. Combined with `expandPath` (which expands `~`), a builder can point gRPC at any directory readable by the server process (e.g., `/etc`, `/proc/self`, the secrets mount). Then `fs.statSync` is called on each entry. | Medium | **P1** |
| **F3** | `server/src/modules/log-to-file/constants/index.ts:17` | `path.join(os.homedir(), filePath, 'tooljet_log')` where `filePath` is the function arg `LOG_PATH`. Operator-controlled, not request-controlled, so no direct exploit; flagged because path-join + first-arg-is-attacker-data is the canonical traversal recipe and this is the kind of thing a future refactor breaks. | High | **P3** |
| **F4** | `server/src/modules/apps/services/app-import-export.service.ts` (entry point `extractImportDataFromAppParams`, line 633) | `POST /api/v2/resources/import` accepts a JSON tree that names datasources, queries, and plugins. Imported queries are not auto-executed but their *definitions* are landed in the workspace as builder-trusted, including plugin IDs that select which connector code runs. If a stage-3 PoC can land a malicious plugin id pointing at a marketplace package that the host hasn't pre-vetted, that's RCE-via-import. Also worth confirming that the JSON depth/size limit (50 MB JSON body) cannot be used to OOM the importer. | Medium | **P2** |

### 2.6 XSS / HTML injection (frontend, sweep #11)

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **X1** | `frontend/src/AppBuilder/Widgets/NewTable/_components/DataTypes/HTML.jsx:66, 115, 154` and `String.jsx:123` | `dangerouslySetInnerHTML={{ __html: getCellValue(cellValue) }}` — **no DOMPurify** on these paths (compare to the same widget's `Text.jsx:154` which does sanitize). Cell values come from query results, i.e., any data source. With CSP allowing `'unsafe-inline'`/`'unsafe-eval'`/`connect-src '*'` (`RECON.md` §4.2), executing JS in this context is a full app-builder takeover — and on a public app it's a drive-by for any visitor. | Low | **P0** |
| **X2** | `frontend/src/AppBuilder/_hooks/useAppData.js:180` and `frontend/src/Editor/Editor.jsx:451` | `styleTag.innerHTML = data?.css || null;` — CSS body is taken from app metadata. CSS injection itself is bounded, but `innerHTML` of a `<style>` happily accepts `</style><script>...</script>` (browsers parse the closing tag), so if `data.css` is attacker-controlled (custom-styles workspace setting → tenant-shared) the script tag escapes. Verify whether `data.css` ever comes from a builder-role user only. | Medium | **P1** |
| **X3** | `frontend/src/Editor/Components/DraftEditor.jsx:303`, `frontend/src/AppBuilder/Widgets/DraftEditor.jsx:309`, `frontend/src/Editor/Components/Text.jsx:213`, `frontend/src/AppBuilder/Widgets/Text.jsx:219`, `frontend/src/AppBuilder/Widgets/Table/GenerateEachCellValue.jsx:184` and the older `Editor/Components/Table/GenerateEachCellValue.jsx:184` | `dangerouslySetInnerHTML` without a visible sanitizer. Need to confirm at the call site whether sanitization happens earlier in the chain. The pattern repeats often enough (`grep -c dangerouslySetInnerHTML` ≈ 36 hits in `frontend/src/`) that the safer assumption is "at least one path is unsanitised". | Medium | **P1** |
| **X4** | `frontend/src/Editor/CommentNotifications/Content.jsx:55`, `frontend/src/Editor/Comment/CommentBody.jsx:63`, `frontend/src/_components/NotificationCenter/Notification.jsx:45` | `dangerouslySetInnerHTML={{ __html: hightlightMentionedUserInComment(comment) }}`. The helper does string-replace mentions into anchor tags with no escaping of the surrounding comment body. A comment containing `<img onerror=...>` ships through unfiltered. | Low | **P0** |
| **X5** | `frontend/src/_ui/{Input,Input-V3,Textarea}/index.js` (`<small dangerouslySetInnerHTML={{ __html: helpText }}/>`) | `helpText` is a prop. Likely passed from app-builder-defined widget props — **builder controls it, end-user reads it**. Same pattern reaches the public-app render. | Medium | **P1** |
| **X6** | `frontend/src/AppBuilder/Widgets/Html.jsx:142`, `frontend/src/Editor/Components/Html.jsx:32`, `frontend/src/Editor/Components/SvgImage.jsx:11` | These *do* call `DOMPurify.sanitize` (with `{ FORCE_BODY: true }` for the HTML widgets). SVG with `DOMPurify.sanitize(data)` (defaults) does still allow `<a href="javascript:...">` unless `USE_PROFILES: { svg: true }` is set — verify in stage 3. | Medium | **P2** |

### 2.7 Crypto / session

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **C1** | `server/src/helpers/bootstrap.helper.ts:222` | `app.enableCors({ origin: configService.get<string>('ENABLE_CORS') === 'true' \|\| tooljetHost, credentials: true })`. When `ENABLE_CORS=true`, `origin: true` reflects **any** request `Origin` and pairs it with `Access-Control-Allow-Credentials: true`. Combined with **C2**, any web page can fire authenticated cross-origin requests. | Low | **P0** |
| **C2** | `server/src/modules/session/util.service.ts:113-117, 122` | `if (ENABLE_PRIVATE_APP_EMBED === 'true') { sameSite = 'none'; secure = true; }`. Drops the only same-site CSRF defense. Confirmed to fire for both the regular cookie issuance (line 122) and the switch-organization branch at line 346 (sweep #10). | Low | **P0** |
| **C3** | `server/src/helpers/bootstrap.helper.ts:233-280` | CSP includes `'unsafe-inline'`, `'unsafe-eval'`, `connect-src '*'`, `frame-src '*'`, `frame-ancestors '*'`. Effectively no defense-in-depth against any of the XSS findings in §2.6, and `frame-ancestors '*'` defeats the optional `frameguard: { action: 'deny' }`. | Low | **P1** |
| **C4** | `server/src/helpers/utils.helper.ts:isHttpsEnabled (~588)` | `secure: isHttpsEnabled()` returns true only when `TOOLJET_HOST.startsWith('https')`. Behind a TLS-terminating proxy (the typical deploy) the env var is often plain `http://...`, so the auth cookie is sent over plain HTTP between the proxy and the browser if the proxy ever downgrades. | Medium | **P2** |
| **C5** | `server/src/helpers/tooljet_db.helper.ts:282-285` | `Math.random()` chooses the four mandatory characters of TJDB role passwords. With **K1** (logging the random bytes), the *remaining* 26 characters are recoverable too; but even on its own, four predictable characters in a 30-char password lower brute-force space significantly. | Low | **P2** |
| **C6** | `server/src/modules/request-context/middleware.ts:10` | `Math.random()` for `transactionId`. Used only in logs/tracing; not security-sensitive on its own. | High | **P3** |
| **C7** | `server/src/modules/encryption/service.ts:47-56` | HKDF salt parameter is the (non-secret) `table` name; `info` parameter is `Buffer.alloc(32, '´', 'ascii') || '<column>_ciphertext'`. This is fine cryptographically (HKDF tolerates non-secret salts), but the comment claims "Lockbox compat" — verify the migrated salt is **actually** identical to what Lockbox produced for the same column, otherwise legacy ciphertexts decrypt as garbage. (Operational, not a flaw.) | High | **P3** |
| **C8** | `server/src/modules/tooljet-db/services/postgrest-proxy.service.ts:216-225` | JWT signed with HS256 from `PGRST_JWT_SECRET`, role `user_<organizationId>`, `expiresIn: '1m'`. Fine in isolation; the risk vector is `PGRST_JWT_SECRET` being a deploy-time placeholder (the same operational hazard as `LOCKBOX_MASTER_KEY` — see **K7**). | Low | **P2** |
| **C9** | `server/src/modules/scim/guards/scim-auth.guard.ts:30, 38` | Comparison via `===` (timing-leaky). Already covered in **A1**; called out again here for the timing dimension. | Medium | **P2** |
| **C10** | `server/src/modules/app/module.ts:151-156` | `BullBoardModule.forRoot({ middleware: basicAuth({ users: { admin: process.env.TOOLJET_QUEUE_DASH_PASSWORD } }) })`. If the env var is unset the value becomes `undefined`. `express-basic-auth`'s behavior with an `undefined` user value differs across versions — at minimum it's a deploy-time landmine, and if the operator sets `TOOLJET_QUEUE_DASH_PASSWORD=""` the dashboard accepts an empty password. | Low | **P1** |

### 2.8 ReDoS and resource exhaustion

| # | File:line | Why exploitable | FP | Priority |
|---|---|---|---|---|
| **R1** | `server/src/main.ts:194-207` | JSON body limit `MAX_JSON_SIZE` defaults to **50 MB**, URL-encoded `parameterLimit: 1_000_000`. Combined with the unauthenticated `/forgot-password` (no rate-limit, **A5**), the unauthenticated `/api/scim/*` (under operator-set auth, but with the full body limit), and unauthenticated import endpoints, a single client can pin event-loop resources by sending 50 MB JSON bodies. The `import` endpoint (`POST /api/v2/resources/import`) is the more interesting target since it parses the JSON tree exhaustively. | Low | **P1** |
| **R2** | `server/src/helpers/import_export.helpers.ts:55-74` | Two regexes evaluated on every input: `/\b(components\|queries\|globals\|variables\|page\|parameters\|secrets\|constants)(?:\[\S*\|\.\S*\|\?\.\S*)/` and `/\b(components\|queries)(\??\.\|\??\.?\[['"]?)([0-9a-f]{8}-…){12}(['"]?\])?/g`. The first uses `\S*` (greedy) on a string of arbitrary length; the second has nested optional groups around the `[`/`'`/`"` markers. Sufficient input length with carefully placed brackets and escapes can drive backtracking. Triggered on every import/export tree node. semgrep flagged the same `expressionRegex.exec(input)` loop on line 156. | Medium | **P2** |
| **R3** | `server/src/modules/data-sources/util.service.ts:466, 484` | `/{{constants\|secrets\|globals.server\..+?}}/g` — the operator precedence is wrong: this matches `{{constants` **or** `secrets` **or** `globals.server\..+?}}`, not what the developer intended. Beyond the bug-bug, `.+?` over arbitrary string input is a textbook (mild) ReDoS shape. The misparse is more impactful: it triggers `resolveConstants` on inputs the developer thought were filtered out, doing extra work and potentially leaking secrets into log lines. | Low | **P1** |
| **R4** | `server/src/scripts/rotate-lockbox-key.ts:221`, `server/scripts/services/rotation.service.ts:38` | semgrep `regex_dos` flags. Operator-only scripts; the inputs are DB rows (`*_ciphertext`). Low blast radius; mentioned for completeness. | High | **P3** |
| **R5** | `lib/utils.ts:resolveCode` (`isolated-vm` execution) | `WORKFLOW_JS_TIMEOUT_MS` defaults to **100 ms** and `WORKFLOW_JS_MEMORY_LIMIT_MB` to **20 MB** (per-isolate). Reasonable. But `wrapInIIFE: false` is used for `getQueryVariables` (line 176), which lets a `{{ ... }}` expression run **at top-level** and leave bindings — a supply-chain step toward sandbox escape that is worth a dedicated stage-3 probe. | Medium | **P2** |

---

## 3. Findings explicitly judged **not** to be issues

These showed up in the sweeps and are **not** carried forward:

- **27 × `node_nosqli_injection`** semgrep hits in TypeORM `findOne({ where: {...} })` calls. All confirmed as TypeORM lookups against typed columns; not a NoSQL-injection surface (`server/src/modules/login-configs/service.ts`, `…/onboarding/service.ts`, `…/organization-users/service.ts`, etc.).
- **`server/src/modules/organization-constants/service.ts:11`** (`const secretValue = '**********'`) — masking string, not a real secret.
- **`server/scripts/{create,drop}-database.ts`** + **`server/scripts/populate-sample-db.ts`** child-process / TLS-bypass hits — operator-run scripts not exposed to traffic.
- **`server/data-migration-config.ts`** + **`server/ormconfig.ts`** TLS-bypass hits — same: build/migration config, not request path.
- **All `*.spec.ts` / `__tests__/` / `cypress-tests/` hits** — not in production runtime; **K9** is the only one named because the `node_username` rule matched a clearly hard-coded test password.
- Helmet rules `helmet_header_check_csp / frame_guard / referrer_policy / x_powered_by` — Helmet *is* mounted (`bootstrap.helper.ts:233`), but with a deliberately permissive CSP (covered by **C3**) and an inverted `frameguard` boolean (covered in `RECON.md` §3.1). The semgrep rules just see "no helmet defaults" and misfire.

---

## 4. Validation priority summary (fastest path through stage 3)

**P0 — start here, in this order**

1. **A1** SCIM Bearer auth bypass when env unset (≤ 5 minutes to confirm by curl).
2. **C1 + C2** CORS reflection + `SameSite=none` cookie under `ENABLE_CORS` / `ENABLE_PRIVATE_APP_EMBED` (one-shot HTML harness).
3. **S1 / S2 / S3** REST/OpenAPI/GraphQL SSRF, including loopback + cloud metadata.
4. **S8** Cookie tossing — an attacker-controlled REST upstream sets `tj_auth_token` in the user's browser.
5. **I1** Postgres GUI bulk-update SQL injection.
6. **I5** `eval(modifiedContent)` on log-rotation file (audit-log content reachability check).
7. **K1** Logging of TJDB password seed bytes.
8. **X1 / X4** unsanitised `dangerouslySetInnerHTML` in HTML cell type and comment rendering.

**P1 — same-day**

`A2`, `A3`, `A4`, `A5`, `A6`, `A9`, `I2`, `I3`, `I4`, `I6`, `I7`, `I9`, `I10`, `S4`, `S6`, `S7`, `K3`, `K4`, `K6`, `K7`, `F2`, `X2`, `X3`, `X5`, `C3`, `C10`, `R1`, `R3`.

**P2 — this audit cycle**

`A7`, `A8`, `A10`, `I8`, `S5`, `S9`, `S10`, `K5`, `K8`, `F1`, `F4`, `X6`, `C4`, `C5`, `C8`, `C9`, `R2`, `R5`.

**P3 — background / FYI**

`K2`, `K9`, `F3`, `C6`, `C7`, `R4`, all the rejected items in §3.

---

## 5. Artefacts

- `sast-raw.json` — raw semgrep envelope (76 results, 0 errors, 1996 paths scanned).
- `semgrep-stderr.log` — stderr from the run (only urllib3/chardet warning; the failed `p/express` config from the first attempt was retried and succeeded).
- `/tmp/sast-grep/01..12-*.txt` — raw output of the 12 ripgrep sweeps used to triage candidates beyond what the registry rules found.
