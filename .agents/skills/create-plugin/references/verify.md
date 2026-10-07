# Verify

Run in order from `marketplace/`. Report each check as pass, fail, or skipped with the reason.
Plugin jest tests are not a gate (`__tests__/index.js` is an `it.todo` stub; no jest setup —
`marketplace/AGENTS.md`).

## 1. Build

```bash
cd marketplace
test -d plugins/common/dist || npm run build --workspace=@tooljet-marketplace/common
npm run build --workspace=@tooljet-marketplace/<id>; echo "exit $?"
```

`ncc` compiles `lib/index.ts`, so this is also the type check; exit 0 passes. Don't pipe the
build (a pipe reports the last command's exit code). Missing module → add the dependency
(`npm i <pkg> --workspace=@tooljet-marketplace/<id>`).

## 2. Validator

```bash
npm run validate:plugin -- <id>
```

It checks:

- the required files exist;
- `manifest.json` and `operations.json` match `plugins/schemas/`;
- no unreplaced `{{UPPER_CASE}}` template placeholder remains in those two files;
- the id (`source.kind`) appears exactly once in `plugins.json`, is not a built-in connector
  kind, and equals the directory name;
- every `@spec/` reference uses the plugin id and has a file in `openapi-specs/`; without
  `@spec/`, every operation value is handled in `lib/*.ts`.

Output is `PASS <id>`, `KNOWN <id>: <reason>` for drift already recorded in the validator (not
a failure), or `FAIL <id>: <reason>`, then a summary line. Exit 0 means no `FAIL`.
`--skip-registry` skips only the `plugins.json` check.

## 3. Lint

```bash
ESLINT_USE_FLAT_CONFIG=false npx eslint --fix 'plugins/<id>/lib/**/*.ts'
ESLINT_USE_FLAT_CONFIG=false npx eslint 'plugins/<id>/lib/**/*.ts'
```

The first applies prettier; the second must exit 0 (silent when clean); fix the rest by hand.
The env var matches CI: without it eslint 8 picks up the frontend's flat config and fails.

## 4. Spec and PRD coverage

The validator cannot see `plugin-spec.json` or the PRD. Check by reading:

- Every spec operation is in `operations.json` (or in the shipped OpenAPI spec for
  `api-endpoint`) and handled in `index.ts`.
- Every PRD requirement maps to an operation or field; list any that do not.
- `source.kind` equals the id; secrets are encrypted; `customTesting` matches whether
  `testConnection` exists.
- For `api-endpoint`, every shipped spec still passes `npx @apidevtools/swagger-cli validate`
  (3.1 patch versions: `intake-openapi.md` section 1).

## 5. UI check (optional)

Needs a browser automation tool, ToolJet running from this checkout (server via
`npm run start:dev` or `tools/tj/bin/tj start`), and an admin or builder login. Skip, naming
what's missing, if any is absent, the frontend is unreachable, or on Cloud (no marketplace).
Never block the run on it. Install facts: `marketplace/AGENTS.md`, Local install. First set
`ENABLE_MARKETPLACE_DEV_MODE=true` in the root `.env` and restart the server. Frontend URL =
`TOOLJET_HOST` in that `.env`; if unset, ask.

1. Build (section 1). After any later edit, rebuild before reloading.
2. Sign in. A fresh database redirects to `/setup`: create the first admin only if the user
   agrees; otherwise ask for a login.
3. Open `<host>/integrations/marketplace`, search for the `plugins.json` name, click **Install**. If it already shows **Installed**, use the refresh icon on its card
   in `<host>/integrations/installed` instead.
4. Open or reload `<host>/<workspace-id>/data-sources` and search for the plugin. It is under the
   section for the manifest `type` (APIs, Databases, Cloud Storages), or **Plugins** when there is
   none. **Add** creates the data source and opens its form.
5. Form: fields, order, labels, widgets, and every `dropdown-component-flip` / `toggle-flip`
   branch; compare with the design reference if there is one. Footer: `customTesting: false`
   shows **Test connection** and **Save**, `true` only **Save**; an OAuth code flow shows neither.
6. Credentials: never ask for or type production secrets. With test credentials from the user,
   **Test connection** must report success; then **Save**. Without them, enter placeholders and
   expect a failed test: report "auth not exercised", not a pass.
7. Query editor: **Create an app**, click **+** in the query panel, pick the data source. Every
   `operations.json` operation must list and show its parameters. For `api-endpoint`, open a few
   operations with path params and a body. `@spec` files are cached for an hour: after a reload,
   bypass the browser cache.
8. With test credentials only, run one read operation (**Run** or **Preview**) and check it does not error.

Take a screenshot per step. Report structural differences (missing field, wrong order, wrong
widget, wrong label), not pixel differences.

## 6. Validate-only report

For an existing plugin, run sections 1 to 3 (4 when a PRD or spec is given) and report, fixing
nothing unless asked:

- Build, validator and lint: pass or fail, with the exact error lines.
- `any` count in `lib/*.ts` (`grep -c ': any\|as any\|<any>'`).
- `customTesting` against `testConnection`: `false` or absent without `testConnection` means the
  button fails with "testConnection method not implemented" (an OAuth code flow hides the button,
  so there it is only inconsistent); `true` with a `testConnection` leaves it unused.
- Secrets without `encrypted: true`, and `required` keys missing from `properties`.
- Older spellings: `specUrl` instead of `spec_url` (the server accepts both; templates use
  `spec_url`), `react-component-oauth-authentication` (`marketplace/AGENTS.md`).
- `plugins.json` entry count, and `source.kind` equal to the directory name.
