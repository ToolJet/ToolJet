# ssrf module

Owns the outbound requests (SSRF) settings exposed on Settings -> Security -> Outbound requests (the user-facing name; code, setting keys and the API keep `ssrf`), and the in-process runtime config the SSRF checks read. Super Admin only, no licence gate.

## Domain terms

- **SSRF allowlist** — hostnames, IPs and CIDR ranges that bypass SSRF checks (see `/UBIQUITOUS_LANGUAGE.md`).
- **SSRF runtime config** — the in-process object `globalThis.__TOOLJET_SSRF_RUNTIME_CONFIG__` (`{ enabled, allowedHostnames: Set, allowedRanges: net.BlockList }`).

## Key files

| File | Role |
|---|---|
| `module.ts` | Registers the API and the publisher. AppModule leaves it out when `IS_GET_CONTEXT` |
| `controller.ts` | `GET`/`PUT /api/instance-settings/ssrf`, `POST /api/instance-settings/ssrf/dismiss-notice` (path kept from before the split). CE stub: 404 |
| `service.ts` | CE stub. EE (`ee/ssrf/service.ts`) validates and saves the toggle and allowlist |
| `runtime-config.service.ts` | CE stub: no-op `refresh()`. EE publishes the runtime config |
| `util.service.ts` | Writes the SSRF rows of `instance_settings` |
| `constants/index.ts` | Feature keys `GET` / `UPDATE`, setting keys `SSRF_SETTINGS`, allowlist cap |
| `/server/src/helpers/ssrf-allowlist.helper.ts` | Parses and validates allowlist entries |
| `/server/src/helpers/ssrf-protection.helper.ts` | Server-side SSRF check; exports `SSRF_RUNTIME_CONFIG_KEY` |

## Storage

The settings are rows in `instance_settings` (`type: system`), seeded by a data migration. This module reads them through the instance-settings module's util service and writes them with its own util service; the instance-settings module itself has no SSRF code.

## Edition split

- EE override: `server/ee/ssrf/` publishes the runtime config on boot and refreshes it every 30 s from the `SSRF_PROTECTION_ENABLED` and `SSRF_ALLOWED_ADDRESSES` rows.
- CE and Cloud never publish the runtime key. CE keeps its env-var behaviour (`SSRF_PROTECTION_ENABLED`, `SSRF_DNS_RESOLUTION_CHECK`, `SSRF_BLOCKED_SCHEMES`). Cloud ignores those env vars: protection is always on, with the DNS check, the fixed blocked-scheme list and private ranges (10/8, 172.16/12, 192.168/16) blocked in every SSRF check. The SSRF endpoints return 404 on both.

## Invariants & gotchas

- Runtime key name is identical in three copies: `plugins/packages/common/lib/ssrf-protection.ts`, `marketplace/plugins/common/lib/ssrf-protection.ts`, `server/src/helpers/ssrf-protection.helper.ts`. Change all or none.
- The plugins and marketplace copies are byte-identical; a test in each suite fails if they drift. Without the runtime key both follow the server helper: Cloud always on; EE opt-in via `SSRF_PROTECTION_ENABLED=true`; CE on unless `SSRF_PROTECTION_ENABLED=false`, blocking loopback and metadata but not RFC1918, with `localhost` allowed and unresolvable names failing open.
- The SAML `picture` attribute download (`ee/auth/oauth/util-services/saml.service.ts`) runs the same check, follows no redirects, and keeps only an `image/*` response within the 2 MB avatar limit.
- Not loaded in the migration app context (`IS_GET_CONTEXT`): AppModule skips the module, and `module.ts` also drops the publisher there. Its boot read of `instance_settings` would otherwise wait on the migration transaction's own lock, and `db:reset` / fresh installs hang.
- When the key is present, env vars are ignored: DNS resolution check always on, fixed blocked-scheme list, private ranges (10/8, 172.16/12, 192.168/16) blocked, no `localhost` exemption.
- An allowlist match skips every check, including the SSRF-safe `lookup` hook.
- Allowlisted addresses are reachable by anyone who can run a query, including through public apps; the settings UI says so.
- Fail closed: before the first successful read the publisher sets `{ enabled: true, empty allowlist }`. A change takes up to 30 s to apply.
- Allowlist: max 200 entries, trimmed and lowercased, CIDR `/0` rejected.
- Rows are `type: system`, seeded by a data migration; the SSRF keys must not be added to `BASIC_PLAN_SETTINGS` (no licence gate).
- The data migration seeds the toggle by install type: a new installation (no workspace yet) gets it unset; an existing setup gets an explicit value matching its old behaviour (`'false'`, or `'true'` if it had `SSRF_PROTECTION_ENABLED=true`), so upgrading never flips it, and its dashboard notice is stored as already dismissed (the notice is for new installations only). `isSSRFProtectionEnabledSetting` (`ssrf-allowlist.helper.ts`) decides it for both the publisher and the settings API: an explicit `'true'`/`'false'` wins; unset means off in dev mode (`NODE_ENV=development`, set by `npm run start:dev`) and on everywhere else.
- Test connection runs the SSRF check for every data source kind; only the built-in database drivers in `SSRF_UNCHECKED_DATABASE_KINDS` (`data-sources/util.service.ts`) skip the `host` check (see `data-sources/AGENTS.md`).

## Related modules

- `instance-settings` — owns the table; this module only reads through its util service.
- `data-sources` — test connection and query execution call the SSRF check.
- `plugins/packages/common` — shared SSRF helper used by connectors.
