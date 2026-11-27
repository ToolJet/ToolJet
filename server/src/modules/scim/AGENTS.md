# scim module

SCIM 2.0 push provisioning: an identity provider creates, updates and deactivates users and groups in a Workspace. Not the same as Group Sync, which maps groups at login (see `/UBIQUITOUS_LANGUAGE.md`).

## Key files

| File | Role |
|---|---|
| `guards/scim-auth.guard.ts` | `ScimAuthGuard` — authenticates every SCIM route from env credentials |
| `controllers/` | CE stubs for `/scim/v2/Users` and `/scim/v2/Groups` |
| `service.ts`, `util.service.ts`, `repository.ts` | CE stubs; real logic in EE |

## Edition split

- EE override: `server/ee/scim/` — real controllers and services. They reuse the CE `ScimAuthGuard`; there is no EE guard.
- Off unless `SCIM_ENABLED=true`.

## Invariants & gotchas

- Two auth schemes, each on only when its own secret is set: Basic (`SCIM_BASIC_AUTH_USER` + `SCIM_BASIC_AUTH_PASS`) and header token (`SCIM_HEADER_AUTH_TOKEN`, sent after any scheme name, e.g. `Bearer <token>`, or as the bare header value). A scheme never falls back to the other's secret.
- An unset or empty secret must never match a request. Compare with `equalSecret` (constant time), never `===`.
- The sample values an earlier `.env.example` shipped are refused (`SAMPLE_BASIC_USER`/`SAMPLE_BASIC_PASS` as a pair, `SAMPLE_HEADER_TOKEN`), so copies of that file do not authenticate.
- Basic credentials split on the first `:` only; passwords may contain `:`.

## Related modules

- `mcp-oauth` — source of `equalSecret`
- `group-permissions`, `users` — what SCIM writes to
