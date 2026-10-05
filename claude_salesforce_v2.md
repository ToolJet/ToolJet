Salesforce Plugin New Authorisation option - PKCE

- In the salesforce plugin only Oauth flow is been used withing that, grant type is authorisation code.
- We would need to introduce the new grant type Authorization code ( PKCE ).
- Since there is no drop down for Authentication type introduce a new drop down with default as Oauth 2.0 as only option and the default option.
- New drop down for Grant type and it must contain Authorisation code and Authorisation code with PKCE option only. And the default option is Authorisation code.
- Scopes field is missing.
- Add the field for Access token url, Access token url custom headers, Authorization URL, Scopes.
- When the Access token url and Authorization url is empty, make use of the existing flow.
- Migration for the new drop downs introduced, data migration, and backfill with default values.

- Add new fields requeired for Authorisation code ( PKCE ) flow, add new fields required. Since this is a new authentication method, backend logic must be implemented also.
- Add the Add the field for Access token url, Access token url custom headers, Authorization URL, Scopes. for PCKE flow as well.

- /Users/ganesh/Desktop/tj-salesforce-plugin/marketplace/plugins/salesforce
- Note : All the changes must be backward compatible

---

# Implementation plan

## 0. Confirm assumptions (read-only)
- Check how `react-component-oauth` handles `allowed_auth_types`, `allowed_grant_types`, `allowed_field_groups`.
- Find where the server calls `authUrl`, `accessDetailsFrom`, `refreshToken` and what it passes as `source_options`.
- Check jsforce support for `authzServiceUrl`, `tokenServiceUrl`, and passing `code_verifier` to `authorize()`.

## 1. Manifest (`lib/manifest.json`)
- Auth type dropdown: `allowed_auth_types: ["oauth2"]`, default `oauth2`.
- Grant type dropdown: `allowed_grant_types: ["authorization_code", "authorization_code_pkce"]`, default `authorization_code`.
- Field groups:
  - `authorization_code`: `client_id`, `client_secret`, `scopes`, `access_token_url`, `authorization_url`.
  - `authorization_code_pkce`: same, plus `code_verifier` (user input, encrypted).
- Add new keys to `source.options`; `client_secret` and `code_verifier` are `encrypted: true`.
- Bump the version.

## 2. Plugin logic (`lib/index.ts`, `lib/types.ts`)
- Add new fields to `SourceOptions`.
- One helper resolves authorization URL, token URL and scopes, shared by `authUrl`, `accessDetailsFrom` and `refreshToken`.
- Both URLs empty: existing flow unchanged. Only one set: the other falls back to the Salesforce default.
- `authUrl`: configured scopes plus `refresh_token offline_access` (fallback `full`). For PKCE, add `code_challenge` and `code_challenge_method=S256`, derived from the user's `code_verifier` (SHA-256, base64url). No verifier generation.
- `accessDetailsFrom`: for PKCE, send the user's `code_verifier` with the token exchange.
- `refreshToken`: use the resolved token URL.
- Custom URLs go through jsforce OAuth2 options. If jsforce cannot send `code_verifier`, add a small manual POST for the PKCE token exchange only.
- Validate the verifier up front (present, 43-128 characters, allowed character set) and throw a clear `QueryError`.
- Update the `grantType === 'authorization_code'` check in `run()` to include `authorization_code_pkce`.

## 3. Migration and backfill
- TypeORM migration for `kind = 'salesforce'` data sources: set `auth_type = oauth2` and `grant_type = authorization_code` where missing, keep `scopes = full`, leave new fields empty. Idempotent and reversible.
- Runtime fallback in the plugin: missing `auth_type` / `grant_type` read as `oauth2` / `authorization_code`.

## 4. Backward compatibility
- Data sources without the new fields take today's code path.
- Multi-user auth, `tokenData` and the `tooljet_app` OAuth type are untouched.

## 5. Tests and docs
- Extend `__tests__/index.js`: default flow, custom-URL flow, PKCE flow (challenge derivation, verifier in the token exchange).
- Update the README and the Salesforce docs page.

## PKCE wiring
1. User selects OAuth 2.0 and "Authorization code with PKCE", enters client ID/secret, scopes, optional URLs, and the code verifier.
2. Connect: the server calls `authUrl`; the plugin adds `code_challenge` (S256) to the URL, using the custom `authorization_url` if set.
3. Salesforce redirects to `/oauth2/authorize?code=...`; the existing route handles it. No server state is needed because the verifier is stored.
4. The server calls `accessDetailsFrom`; the plugin exchanges the code at the token URL with `code_verifier` and returns `access_token`, `refresh_token`, `instance_url` as today.
5. Queries and refresh work as today.

Tradeoff: a fixed, user-entered verifier is reused for every authorization, so it gives much weaker protection than a per-request random verifier.


### 🚀 Feature 2 : Sandbox & Custom domain login URL ( 🆕 )
- Feature does not exist. Plugin always uses default `login.salesforce.com` (hardcoded via jsforce default), no config field for it today.

**Why sandbox login is required**
- Sandbox orgs authenticate against a different host (`test.salesforce.com`), not the production host.
- Using the production login host against a sandbox org fails outright — no workaround today.

**Why custom domain (My Domain) login is required**
- Salesforce is enforcing My Domain across orgs; once enforced, the generic production login host stops working for that org's OAuth flow.
- Without this, any customer on a sandbox or a My Domain-enforced org cannot connect at all.

**Difference: login URL vs instance URL**
- Login URL = the *authorization server* — where login/consent, code exchange, refresh, and revoke calls go. User/admin-configured (production / sandbox / custom domain).
- Instance URL = the *API server* — the specific pod (or My Domain host) that serves the org's actual data. Always returned dynamically by Salesforce after auth; never typed in, never changed by this feature.
- They can end up being the same value when My Domain is enabled, but they're separate fields used at separate points in the flow — login URL is not a substitute for instance URL and must not overwrite it.

**Changes required (Salesforce plugin only)**
- Config: add a login-type selector (Production / Sandbox / Custom Domain) + conditional custom domain text field.
- Resolve selection to a `loginUrl` and pass it into every jsforce OAuth2 call site: `authUrl()`, `accessDetailsFrom()` (code exchange), `refreshToken()` — refresh is the easy one to miss, since skipping it means sandbox/custom-domain connections silently break on first token expiry (~2h) even if initial login works.
- Also apply to `getConnection()` / `getConnectionWithValidatedAuth()` for consistency.
- SSRF-validate the custom domain value (first free-text, user-supplied network endpoint in this plugin) using the existing shared SSRF helper.
- No changes needed outside `marketplace/plugins/salesforce/`.


### 🚀 Feature 3 : SOQL Pagination ( 🆕 )
- 🐞 **Bug** : SOQL queries returning >2,000 rows are silently truncated — Salesforce returns `done:false` + `nextRecordsUrl`, but the plugin has no operation to consume it, so the user just sees a partial result with no error.

**Why LIMIT/OFFSET can't fix it**
- SOQL `OFFSET` is hard-capped at 2,000 by Salesforce — can't page past row 2,000 regardless of `LIMIT`.
- Even under 2,000, large offsets are discouraged (server walks + discards every skipped row) — not Salesforce's recommended pagination path.
- It's also raw text the user types into the query box — no code-level lever to manage it.

**Changes required (Salesforce plugin only)**
- Add `next_records_url` field to the SOQL operation (`operations.json` + `types.ts`).
- In `executeOperation()`: if `next_records_url` is set → `conn.queryMore(next_records_url)`; else existing `conn.query(query)`. Relax the "`soql_query` required" check accordingly.
- No new exposed-variable plumbing needed — `done` / `totalSize` / `nextRecordsUrl` already flow through today via `data`/`rawData`, untouched.
- Usage pattern: two queries — initial fetch + a "load more" query bound to `{{queries.<name>.data.nextRecordsUrl}}`, triggered by a button. Forward-cursor only, no jump-to-page.
- Verify `conn.queryMore()` resolves only against the already-authenticated `instanceUrl` (not an arbitrary host) before treating the new field as safe as-is.

### 🚀 Feature 4 : CRUD on every Object, not just Account. ( 🆕 )
- 🐞 **Bug** : `resource_name` is `disabled: true` in the UI (`operations.json`) and hardcoded to `conn.sobject('Account')` in `executeOperation()` for all four CRUD actions — Contact, Lead, Case, Opportunity, and any custom object are impossible to CRUD today, silently operating on Account instead.
- Not a from-scratch gap: `retrieve`/`update`/`delete` genuinely supported arbitrary objects at initial launch (free-text `codehinter`, backend read `resource_name` dynamically) and were locked down later by PR #9946 ("Fix: Disable resource-name inputs..."), with no PR description/issue explaining the motivating defect. `create` was dropdown-locked to Account only from day one.
- No per-object code needed to fix this — `conn.sobject(apiName)` is Salesforce's generic SObject REST call; any standard or custom object API name works, limited only by the org's schema and the user's permissions.

**Implementation steps**
1. `operations.json` — remove `"disabled": true` from `resource_name` on all four actions (`create`, `retrieve`, `update`, `delete`); keep `"Account"` only as placeholder text, not an enforced value.
2. `lib/index.ts` — in the `case 'crud':` branch, read `queryOptions.resource_name` and pass it into `conn.sobject(resource_name)` for all four actions, replacing the hardcoded `'Account'`.
3. Add a guard: throw `QueryError` if `resource_name` is empty, mirroring the existing empty-SOQL-query check — it's now required user input, not an implicit default.
4. No `types.ts` change needed — `resource_name` is already declared on `QueryOptions`.
5. Test all four actions against at least one non-Account standard object (e.g. `Contact`) and one custom object (`Xyz__c`) to confirm generic behavior end-to-end.
6. Follow-up (separate, larger, not required for this fix): replace free-text `resource_name` with a dynamic dropdown populated via `describeGlobal()`/`describeSObject()` for discoverability — this bug fix doesn't depend on it and should ship first.
- No changes needed outside `marketplace/plugins/salesforce/`.



------ Updated plan -----

Scope: Feature 2 (login URL), Feature 3 (SOQL pagination), Feature 4 (CRUD on any object).
Out of scope for this round: docs and tests (left untouched on purpose). Nothing is changed outside
`marketplace/plugins/salesforce/` except two data migrations in `server/data-migrations/`.
Hard rule: existing Salesforce data sources and saved queries must keep working without interruption.

## Decisions already made
| Topic | Decision |
| :-- | :-- |
| Login URL default | Production (`https://login.salesforce.com`, jsforce's current default) |
| `next_records_url` default | Empty. Empty means "run the normal SOQL query" |
| CRUD `resource_name` default | `Account` (runtime fallback + data migration). Every existing Salesforce CRUD query is rewritten to `Account`, because they all ran on `Account` so far |
| Custom domain hosts | No restriction: any https host is accepted. No allowlist and no env var. The platform SSRF check still runs before the client secret is sent |
| Custom domain input | Accepts `mycompany.my.salesforce.com`, `login.acme.com:8443` or a full `https://...` URL; the plugin keeps only `https://<host[:port]>` |
| Conditional field | Not supported by the manifest (see below), so both fields are always shown |

## Findings that shape the plan
1. **Instance URL is used for connections after OAuth.**
   - Single-user path: `getConnection` builds `jsforce.Connection({ instanceUrl: sourceOptions.instance_url, accessToken: sourceOptions.access_token })`.
   - Multi-user path: `getConnectionWithValidatedAuth` uses `tokenData.instance_url` and throws if it is missing.
   - `instance_url` is captured from the token exchange in `accessDetailsFrom` (`conn.instanceUrl`) and stored with the tokens.
   - The login URL is only used for the OAuth calls (authorize, code exchange, refresh). This feature never changes `instance_url`.
2. **The manifest cannot hide a field conditionally.**
   - `dependsOn` / `depends_on` in `DynamicForm.jsx` only applies to `dynamic-selector` fields.
   - The only conditional rendering is `dropdown-component-flip`. When used, the form renders only the selected group plus `commonFields`, so `api_version` and the OAuth component would have to be restructured. For existing data sources with no stored value, the selected group would be empty. That is too risky for an existing data source form.
   - Result: use the fallback. A "Login type" dropdown and a "Custom domain" text field are both always shown. The custom domain is used only when "Custom domain" is selected and is ignored otherwise.
3. **Migrations do not cover imported apps.** Apps and data sources imported from older exports skip data migrations, so every default must also exist as a runtime fallback in the plugin.

## Feature 2: Login URL (Production / Sandbox / Custom domain)
Files: `lib/manifest.json`, `lib/index.ts`, `lib/types.ts`, one data migration.

1. **Manifest**
   - Add `login_type` dropdown: Production (`production`), Sandbox (`sandbox`), Custom domain (`custom_domain`).
   - Add `custom_domain` text field with placeholder `mycompany.my.salesforce.com` and a hint "Used only when Login type is Custom domain".
   - Add both keys to `source.options`; add `defaults.login_type = production`.
2. **Resolver** (one private helper in `index.ts`)
   - `production` or missing/empty/unknown, to `https://login.salesforce.com` (identical to today).
   - `sandbox`, to `https://test.salesforce.com`.
   - `custom_domain`, to the normalized and validated `https://<host>`.
   - `tooljet_app` OAuth type always resolves to production. The central ToolJet client secret must never be sent to a user-supplied host.
3. **Normalization of the custom domain**
   - Trim and lowercase; accept with or without `https://`; reject any other scheme (`http://`, `ftp://`...).
   - Keep only `https://<host[:port]>`: path, query and fragment are dropped; the port is kept.
   - Reject empty values, embedded credentials (`user@host`) and IP addresses (Salesforce login hosts are always host names).
4. **No domain restriction, no env var**: any https host is accepted (decision: custom domains are not limited to Salesforce hosts).
5. **SSRF check** (kept)
   - Async `validateUrlForSSRF` (exported by the common package) in `accessDetailsFrom` and `refreshToken`, before the client secret is sent. It follows the platform policy, which depends on the edition: Cloud blocks private and loopback ranges; self-hosted allows RFC1918 and `localhost` but still blocks loopback IPs and cloud metadata addresses; unresolvable hosts are blocked.
   - `authUrl` is synchronous, so it does the format check only.
   - Residual risk: anyone with edit rights on the data source can point it at any public host, and the next code exchange or refresh sends the stored client secret and refresh token there.
6. **Call sites**: pass the resolved URL as `loginUrl` to `jsforce.OAuth2` in `authUrl`, `accessDetailsFrom` and `refreshToken` (refresh is the easy one to miss: sandbox and custom domain would break at the first token expiry).
7. **Connection builders** (`getConnection`, `getConnectionWithValidatedAuth`): deliberately not changed. They call the instance URL, not the login URL, so changing them has no effect and would add a way for existing queries to fail.
8. **Migration**: part of the single combined migration `1790500000000-BackfillSalesforceOptions.ts` (see "Summary of changes"): sets `login_type = production` in `data_source_options` where missing. Idempotent, never overwrites; `down` is a no-op.
9. **Caveat to document later**: changing the login type on a connected data source requires reconnecting, because the stored tokens were issued by the previous host.

## Feature 3: SOQL pagination
Files: `lib/operations.json`, `lib/types.ts`, `lib/index.ts`.

1. Add `next_records_url` (codehinter, empty by default, placeholder `{{queries.<name>.data.nextRecordsUrl}}`) to the `soql` block; add `next_records_url?: string` to `QueryOptions`.
2. In `executeOperation` `case 'soql'`:
   - `undefined`, `null`, empty or whitespace-only (a bound expression resolves to these before the first run and on the last page) is treated as not set, and the existing path runs unchanged, including the "SOQL query cannot be empty" error.
   - Otherwise validate the shape `/services/data/vNN.N/query/<locator>` (clear `QueryError` if invalid), then call `conn.queryMore(url)`.
3. Host safety is already guaranteed by jsforce: it keeps only the last path segment of the URL and rebuilds the request against the connection's own instance URL, so a hostile value cannot redirect the token elsewhere.
4. No migration. Existing queries have no value, so they follow today's path.
5. Usage note for later: in a "load more" query leave `soql_query` empty, otherwise the first page is re-run once `nextRecordsUrl` becomes empty.

## Feature 4: CRUD on any object (default `Account`)
Files: `lib/operations.json`, `lib/index.ts`, one data migration.

1. `operations.json`: remove `"disabled": true` from `resource_name` on `create`, `retrieve`, `update` and `delete`; keep `Account` as the placeholder.
2. `index.ts` `case 'crud'`:
   - `resource_name = (queryOptions.resource_name ?? '').trim() || 'Account'`. An empty value never errors (this replaces the "throw if empty" step in the Feature 4 section above).
   - Validate against `^[A-Za-z][A-Za-z0-9_]*$` (standard, custom `Xyz__c` and namespaced `ns__Obj__c` names pass), since the value goes into the REST path.
   - Use it in all four `conn.sobject(...)` calls instead of the hardcoded `'Account'`.
3. `resource_id` (retrieve/update/delete): reject only values containing `/`, `?`, `#` or `..`.
4. **Data migration**: also part of the combined `1790500000000-BackfillSalesforceOptions.ts`:
   - Targets `data_queries` joined to `data_sources.kind = 'salesforce'` where `options->>'operation' = 'crud'`. Sets `resource_name = 'Account'` for every such query whose value is missing, blank or anything other than `Account`. Reason: until now every CRUD query ran on `Account` regardless of the stored value, so rewriting preserves the exact old behaviour.
   - The migration logs how many queries held a non-Account value before the rewrite.
   - `data_queries.options` is `json`, so cast to `jsonb` as the earlier Salesforce migration does.
   - It runs once (tracked by the migration table), so it never overwrites values users set after this release. `down` is a no-op.
   - Limitation: apps imported later from an older export skip the migration. A stale non-Account value in such an export would be honoured. Blank values still fall back to `Account`.
5. The runtime fallback stays even after the migration, for new queries left blank and for imported apps.

## Summary of changes
| File | Change |
| :-- | :-- |
| `marketplace/plugins/salesforce/lib/manifest.json` | `login_type` dropdown, `custom_domain` field, options + default, version bump |
| `marketplace/plugins/salesforce/lib/operations.json` | `next_records_url` on SOQL; unlock `resource_name` on the 4 CRUD actions |
| `marketplace/plugins/salesforce/lib/types.ts` | `login_type`, `custom_domain` in `SourceOptions`; `next_records_url` in `QueryOptions` |
| `marketplace/plugins/salesforce/lib/index.ts` | Login URL resolver (no domain restriction), SSRF check, `loginUrl` in the 3 OAuth call sites; `queryMore` branch; dynamic `resource_name` with `Account` fallback and name validation |
| `server/data-migrations/1790500000000-BackfillSalesforceOptions.ts` | One combined idempotent migration replacing the three earlier ones (`1790400000000/1/2`): backfills `auth_type`, `grant_type`, `login_type` on Salesforce data sources and rewrites every existing Salesforce CRUD query's `resource_name` to `Account`. New name on purpose, so it also runs where `1790400000000` already ran |
| Not changed | Frontend, server code, docs, tests, connection builders, `instance_url` handling |

## Backward-compatibility matrix
| Existing state | After the change |
| :-- | :-- |
| Data source without `login_type` | Resolves to production: same URLs as today |
| Query without `next_records_url` | Same SOQL path |
| CRUD query with empty or any stored `resource_name` | Migration rewrites it to `Account`; runs on `Account`, as today |
| Imported app that skipped migrations | Same, via the runtime fallbacks |
| `tooljet_app` OAuth type | Always production login host |

## Resolved points and notes
1. Existing CRUD queries with a non-Account `resource_name`: resolved. They are rewritten to `Account` by the migration, because all existing queries ran on `Account`.
2. Env allowlist / domain restriction: dropped. Custom domains are not restricted; `SALESFORCE_ALLOWED_LOGIN_DOMAINS` no longer exists. The SSRF check stays.
3. Connection builders are left untouched on purpose (see Feature 2, item 7), a deviation from the Feature 2 notes above.
