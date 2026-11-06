# organization-constants module

Owns **Workspace Constants** and **Workspace Secrets**: named values that apps reference as `{{constants.name}}` and `{{secrets.name}}`, with one value per Environment. Code still says `organization` for Workspace. A Global and a Secret can share a name; the unique key is (name, workspace, type).

## Key files

| File | Role |
|---|---|
| `controller.ts` | v1 endpoints. The app builder and Cypress tests use them. Do not change their behaviour. |
| `controller.v2.ts` | v2 endpoints under `/api/v2/organization-constants`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `POST /bulk-delete`. For the Constants page. |
| `service.ts` | v1 methods, plus `listConstants`, `getConstant`, `createConstant`, `updateConstantValues`, `bulkDeleteConstants`. |
| `util.service.ts` | Value writes (`updateOrgEnvironmentConstant`, `touchConstant`), encrypt/decrypt, run-time resolution (`getOrgEnvironmentConstant`). |
| `helpers/constants-list.ts` | Pure: merge, filter, count, sort and page the list. |
| `helpers/constant-values.ts` | Pure: which environments a write touches, the keep-one-value check, duplicate-name error detection. |
| `dto/v2/` | v2 request and response DTOs. Responses are strict `@Exclude` classes; build them with `plainToInstance`. |
| `services/environment-constants.service.ts` | Reads `.env` constants. CE throws. |

## Edition split

- EE: `server/ee/organization-constants/` extends the CE classes. `controller.v2.ts` only re-declares the constructor.
- Edition seams in CE `service.ts`. EE overrides both:
  - `listEnvironmentConstants`: the `.env` constants. CE returns `[]`.
  - `isMultiEnvironmentEnabled`: whether each environment may hold its own value. CE returns `false`.
- Keep license checks behind the seam. Do not put license logic in the v2 write paths.

## Invariants

- A Secret's plaintext never leaves the server from list, read, create or update endpoints. Only run-time resolution decrypts it. v1 `/decrypted` masks Secrets too.
- The `.env` constants cache is process memory shared by all requests. Read it; never mutate it. Helpers copy what they change.
- Every value write goes through `updateOrgEnvironmentConstant`, which calls `touchConstant`. That sets `updated_by` and `updated_at` on the constant row, because values live in a child table.
- Without the multi-environment license, a write sets the one value in EVERY environment (create and update; `null` is rejected). With it, only the listed environments change, and an update cannot leave a constant with no value anywhere.
- Resolution is type-aware: `getOrgEnvironmentConstant` takes the `type` (Global, Secret, Server) and looks up by name, workspace and type. Before, it matched on name only, so a Global and a Secret with one name could return each other's value. It returns `null` when no constant matches; callers (`resolveConstants`) then leave the `{{ }}` text as it is.
- A duplicate (name, type) is detected from the Postgres unique violation, not a pre-check, so concurrent creates cannot both succeed.
- Create and update run in one transaction. Request checks (environments, license rule, keep-one-value) run before the first write.
- Rows from `.env` have the synthetic id `env:<type>:<name>`. They are read-only: bulk delete skips them.

## Gotchas

- The list is built in memory because `.env` constants live in process memory. This is fine up to a few thousand constants per Workspace. Past that, move filter, sort and paging into SQL for database rows and merge `.env` rows after.
- The v1 controller declares `GET :appId`, which shadows any static GET path added after it. That is why v2 is a separate controller with its own version prefix.
- The `.env` cache is never invalidated; a change to the variables needs a restart.
- v1 update accepts a name of up to 50 characters, the same as create.
- Constants with no value in the selected environment are left out of the list; they still exist and show in `GET /:id`.
- In e2e tests a failed statement (the 409 case) aborts the suite transaction until the next test's savepoint rolls back. Put the follow-up request in a separate `it`.

## Related modules

- `app-environments`: the Environment list and the `enabled` flag.
- `data-sources`: its `resolveConstants` calls `getOrgEnvironmentConstant` to resolve references at run time.
- `encryption`: column encryption of stored values.
