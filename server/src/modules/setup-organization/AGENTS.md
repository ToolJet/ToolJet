# setup-organization module

Creates a **Workspace** with everything it needs to be usable, for the dashboard
(`POST /api/organizations`) and External API v2 (`POST /api/v2/ext/workspaces`).

## Key files

| File | Role |
|---|---|
| `controller.ts` | Dashboard create; switches the session to the new workspace |
| `workspaces.controller.v2.ts` | v2 create (CE stub, EE route) |
| `service.ts` | `create` (ban check, legacy audit when there is a user) and `createWorkspaceV2` |
| `util.service.ts` | `create`: the workspace setup itself, in one transaction |

## Invariants & gotchas

- **Workspace setup** (`SetupOrganizationsUtilService.create`): FORM SSO config, default
  environments and groups, creator membership with the admin role (only when a user is passed),
  the `main` branch, sample data source, licence checks, default theme, ToolJet Database schema,
  default data sources. Every create path must go through it.
- The ToolJet Database schema is created in its own transaction and is not rolled back if the
  outer transaction fails.
- v2 create: a PAT caller becomes admin of the new workspace; the shared secret adds no member.
  Neither switches a session. The first workspace on the platform becomes the default.
- `OrganizationsModule` cannot import this module (cycle through `ThemesModule`), which is why v2
  create lives here.

## Related modules

- `organizations` — the rest of the Workspace routes, rules and DTOs.
