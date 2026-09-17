# data-sources module

Owns Data Source connections: creating/configuring connectors (Postgres, REST API, marketplace plugins, ...) at the workspace level, storing their per-Environment credentials encrypted, testing connections, OAuth2 flows, and resolving plugin services that execute queries. Registered as `MODULES.GLOBAL_DATA_SOURCE`; controller route is `data-sources`.

## Domain terms

- **Global Data Source** — workspace-level connection, `scope = 'global'` (`DataSourceScopes.GLOBAL`). The normal case; shared across apps, gated by granular permissions.
- **App-Level Data Source** — legacy per-app connection, `scope = 'local'` (code says "local", UI says app-level). `changeScope`/`convertToGlobalSource` migrates local → global; nothing creates new local ones here.
- **Sample Data Source** — `type = 'sample'` (`DataSourceTypes.SAMPLE`); auto-created Postgres pointing at the shared `sample_db` (`SampleDataSourceService`), refreshed nightly by `SampleDBScheduler`. Cannot be deleted; options hidden from list responses.
- **Static/default Data Source** — `type = 'static'`, kinds in `DefaultDataSourceKinds` (`restapi`, `runjs`, `runpy`, `tooljetdb`, `workflows`); one `${kind}default` row per workspace, no user-editable options.
- **Kind vs type** — `kind` = connector identifier (plugin name); `type` = `static | default | sample`.
- **DSV / DSVO** — `DataSourceVersion` (branch-aware version row, `is_default` / `branch_id` / `is_active`) and `DataSourceVersionOptions` (options per DSV per Environment). Options live here, not on `data_sources`.

## Key files

| File | Role |
|---|---|
| `module.ts` | `SubModule.register()`; imports app-environments, encryption, organization-constants; exports `DataSourcesUtilService`, `SampleDataSourceService`, `PluginsServiceSelector` |
| `service.ts` | CRUD orchestration, scope change, test-connection, OAuth authorize, `invokeMethod` (plugin method invocation + OAuth token refresh/retry), audit-log context |
| `util.service.ts` | The heavy lifter: create/update with option encryption (`parseOptionsForCreate/Update`), `parseSourceOptions` (decrypt + resolve `{{constants.*}}`/`{{secrets.*}}`), OAuth token fetch/update, branch DSV creation, unique-name enforcement |
| `repository.ts` | `allGlobalDS()` — permission-filtered listing with branch/environment DSV+DSVO joins; static/default helpers |
| `controller.ts` | REST endpoints incl. `POST :id/test-connection`, `:id/scope`, `:id/authorize_oauth2`, `:id/invoke`, `dependent-queries/:datasource_id` |
| `services/plugin-selector.service.ts` | Resolves `kind` → plugin `QueryService` from `@tooljet/plugins/dist/server`; EE adds marketplace plugin lookup |
| `services/sample-ds.service.ts` | Creates/updates the sample Postgres source from `SAMPLE_PG_DB_*` env vars across all Environments |
| `ability/` | `FeatureAbilityFactory` — CASL rules from granular `GLOBAL_DATA_SOURCE` permissions (`isAllConfigurable`, `usableDataSourcesId`, ...) |
| `guards/whitelist-plugin.guard.ts` | Restricts `:id/invoke` to an allowlisted set of kinds |
| `guards/validate-query-source.guard.ts` | `ValidateDataSourceGuard` — loads + org-checks the data source for param `id` |
| `dto/index.ts` | `CreateDataSourceDto`, `UpdateDataSourceDto`, `TestDataSourceDto`, `InvokeDataSourceMethodDto`, `ValidateOptionsDto`, ... |

## Edition split

- EE override: `server/ee/data-sources/` — all five providers extend CE and call `super()`. Deltas: `resolveConstants` adds `{{globals.server.*}}` (SERVER constants), controller adds `fetchGlobalDataSourcesForVersion`, plugin selector resolves marketplace plugins.
- Secrets/server constants and granular data-source permissions are license-gated (`LicenseTermsService`, `LICENSE_FIELD`).

## Invariants & gotchas

- **Options are encrypted at rest**: values marked `encrypted` are stored in the `credentials` table via `CredentialsService`; the options JSON keeps only `{ credential_id, encrypted: true }`. Decryption happens in `parseSourceOptions` at query/test time only. Never return decrypted values in list APIs (`getAll` strips sample options and restapi `tokenData`).
- **Options are per-Environment**: one `DataSourceVersionOptions` row per (DSV, environment). Creating a source writes options to every Environment of the workspace. There is no single "the options" — always resolve with an `environmentId`.
- Workspace-constant references (`{{constants.x}}` / `{{secrets.x}}`) inside encrypted fields are stored as `workspace_constant` alongside the credential and resolved per-environment at runtime — value follows the environment, not the stored string.
- Branch-aware behavior (this branch line): delete on a branch soft-deletes (`DataSourceVersion.isActive = false`); released apps read the `is_default` DSV. `branchId` only applies to global-scope sources.
- **`is_synced=false` on create in every mode** (git-off, multi-branch feature, single-branch default) — a brand-new DSV is never-committed, so it stays unsynced until a push (git-sync). There is no single-branch synced-on-create exemption (removed) — mirrors the apps/modules rule. A git-sync pull that finds a synced DSV absent from git **deactivates** it (`isActive=false`), it does not delete the row.
- Scope change is one-way (local → global); sample sources can't be deleted; delete is blocked while dependent queries exist (`findQueriesLinkedToDatasource`).
- NEVER abbreviate `data_source` as `ds` in code or docs.

## Related modules

- `data-queries` — queries belong to a data source; `DataQueriesUtilService` is registered inside this module for option parsing.
- `app-environments` — `AppEnvironmentUtilService.getOptions()` is the canonical per-environment options read path.
- `encryption` — `CredentialsService` / `EncryptionService` for credential storage and column decryption.
- `organization-constants` — workspace constants/secrets resolved into options at runtime.
- `group-permissions` / `ability` — granular usable/configurable data-source permissions feeding `allGlobalDS` and CASL.
- `plugins` — plugin manifests/operations; `PluginsRepository` + marketplace plugin services.
