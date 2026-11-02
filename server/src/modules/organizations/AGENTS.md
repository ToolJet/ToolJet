# organizations module

Owns the **Workspace** (code entity `Organization`): listing, renaming, archiving and the platform
default workspace, for the dashboard and for External API v2. Creating a workspace lives in
`setup-organization`.

## Domain terms

- **Default workspace** — `organizations.is_default`; exactly one at a time.
  `OrganizationRepository.changeDefaultWorkspace` unsets the old one and sets the new one; pass a
  `manager` or the two updates are not atomic.
- **Workspace identifier** (v2 paths) — id, then slug, then name (`OrganizationRepository.findByIdentifier`).

## Key files

| File | Role |
|---|---|
| `controller.ts` | Dashboard routes under `/api/organizations` |
| `workspaces.controller.v2.ts` | External API v2 `/api/v2/ext/workspaces` list/get/update/archive/unarchive/set-default (CE stub, EE routes) |
| `service.ts` | `updateWorkspace` (shared write), dashboard methods, additive `*V2` methods |
| `repository.ts` | `findByIdentifier`, `queryWorkspaces` (v2 list), dashboard fetchers |
| `dto/index.ts` | Dashboard DTOs and the shared `WorkspaceNameField` / `WorkspaceSlugField` validators |
| `dto/v2.ts` | v2 request/response DTOs and `toWorkspaceV2Response` |
| `constants/feature.ts`, `ability/index.ts` | Dashboard and v2 feature config and CASL rules, side by side |

## Edition split

- EE (`ee/organizations/`) overrides `setDefaultWorkspace` (CE throws 501) and registers the v2 routes.
- v2 routes need `LICENSE_FIELD.EXTERNAL_API`; v2 service methods live in the CE base class.

## Invariants & gotchas

- **One write path.** Name, slug and status changes go through `updateWorkspace`; reactivating a
  workspace checks the plan's workspace and user limits (451). Dashboard and v2 methods only add
  their own rules around it.
- **v2 reuses the dashboard's rules and changes only the status code.** v2 archive and PATCH status
  call `updateOrganizationStatus`; its 406 for the default workspace becomes 409 (`asV2Conflict`).
  v2 uniqueness calls `checkWorkspaceUniqueness` once per changed field, so either clash is a 409.
  v2-only rules: 409 when already in the target status, 422 for `default:false` or default plus
  archived, and PATCH `default:true` on the current default is a no-op.
- **A unique-constraint violation aborts the surrounding transaction**, so check uniqueness before
  writing; the constraint is the race backstop.
- **Legacy audit locals** are set only by the dashboard methods. v2 features set `skipAuditLogs`
  and are audited through `audit_events`.
- v2 archive, unarchive and set-default return 200 with an empty body; their audit specs use
  `after: 'reload'`.
- Membership scoping: a non-super-admin PAT lists and reads only workspaces it is an active member
  of (others are 404). The shared secret sees all.

## Related modules

- `setup-organization` — creates workspaces (dashboard and v2) with the full setup.
- `external-apis` — `ExternalApiAuthGuard`, pagination headers, the v2 placement rule.
- `audit-logs` — audit specs on the v2 features; `WorkspaceAuditAdapter`.
