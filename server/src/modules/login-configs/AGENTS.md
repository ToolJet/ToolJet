# login-configs module

Owns sign-in settings (SSO providers and password login) of an instance and of each Workspace (glossary: Workspace = Organization in code).

## Key files

| File | Role |
|---|---|
| `controller.ts` | Settings routes, public login settings route |
| `util.service.ts` | `buildConfigs` (public allow list), `encryptSecret` and `decryptSecret` |
| `ability/index.ts` | Feature abilities per role |
| `constants/index.ts` | Feature keys, `INSTANCE_SSO_SECRET_FIELD` |

## Edition split

- EE override: `server/ee/login-configs/` extends the CE services.

## Invariants & gotchas

- The public login settings return an allow list: `PUBLIC_SSO_FIELDS` and `PUBLIC_CONFIG_FIELDS` in `util.service.ts`.
  A new field on the login page needs an entry there, or anonymous callers do not receive it.
- Secrets are encrypted at rest with `encryptSecret`: every key with `secret` in its name, and the LDAP `ssl_certs.client_key`.
  `decryptSecret` accepts a plain text LDAP key saved before the key was encrypted.
- Instance settings (`GET_INSTANCE_SSO`) are for admins and super admins. They never carry secret values:
  the response has `has_secret` and `has_code_verifier` instead, and a blank secret on save keeps the stored one.
- Group sync rows (instance OpenID) are per Workspace. A non-super-admin sees only the rows of their own Workspace.

## Related modules

- `mcp-oauth` — a changed SSO secret changes the policy fingerprint and revokes grants.
