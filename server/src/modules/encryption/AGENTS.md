# encryption module

Column-level encryption of stored secrets (data source credentials, workspace constants, SSO and SMTP settings, user details) with a key derived from `LOCKBOX_MASTER_KEY`. The format matches the Ruby Lockbox gem the server used before NestJS.

## Key files

| File | Role |
|---|---|
| `service.ts` | `EncryptionService` — `encryptColumnValue` / `decryptColumnValue`; per-column key via HKDF from the hex-decoded master key |
| `services/credentials.service.ts` | `CredentialsService` — create/update/read rows in `credentials` through `EncryptionService` |
| `../../../scripts/rotate-lockbox-key.ts` | `npm run rotate:keys` / `rotate:keys:prod` — re-encrypts every encrypted column from an old master key to a new one |

## Invariants & gotchas

- Changing `LOCKBOX_MASTER_KEY` on an install with data makes every stored secret unreadable. Only `rotate:keys` may change it. Never generate or replace it automatically when data may exist.
- `encryptColumnValue` / `decryptColumnValue` signatures are used by data migrations; do not change them (see the comment in `service.ts`).
- The key is read with `Buffer.from(key, 'hex')`, which stops at the first non-hex character. A non-hex value (an example placeholder string) silently becomes a short or empty key, and data is still encrypted with it. Treat such a value as the real key of that install.
- The raw key string is also an input elsewhere: `sampleDbRole()` (`src/helpers/sample-db-role.helper.ts`) derives the sample database role from it. Two different strings that decode to the same bytes still give different roles.

## Related modules

- `data-sources`, `organization-constants`, `login-configs`, `organization-users` — main callers
