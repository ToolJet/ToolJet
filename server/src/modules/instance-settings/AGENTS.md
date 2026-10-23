# instance-settings module

Owns instance-wide key/value settings (the `instance_settings` table) that only a Super Admin can read or change, plus the SSRF protection settings exposed on Settings -> Security.

## Domain terms

- **Instance settings** — rows keyed by name, scoped to the whole instance, not a workspace.
- **SSRF allowlist** — hostnames, IPs and CIDR ranges that bypass SSRF checks (see `/UBIQUITOUS_LANGUAGE.md`).
- **SSRF runtime config** — the in-process object `globalThis.__TOOLJET_SSRF_RUNTIME_CONFIG__` (`{ enabled, allowedHostnames: Set, allowedRanges: net.BlockList }`).

## Key files

| File | Role |
|---|---|
| `controller.ts` | Instance settings endpoints, including `GET`/`PUT /api/instance-settings/ssrf` and `POST /api/instance-settings/ssrf/dismiss-notice` |
| `service.ts` | Reads/writes setting rows; validates and saves the SSRF toggle and allowlist |
| `ssrf-runtime-config.service.ts` | CE stub: no-op `refresh()`. The real publisher is EE-only |
| `constants/features.ts` | Dedicated feature keys `SSRF_GET` / `SSRF_UPDATE` (no licence gate) |
| `/server/src/helpers/ssrf-allowlist.helper.ts` | Parses and validates allowlist entries |
| `/server/src/helpers/ssrf-protection.helper.ts` | Server-side SSRF check; exports `SSRF_RUNTIME_CONFIG_KEY` |

## Edition split

- EE override: `server/ee/instance-settings/` publishes the runtime config on boot and refreshes it every 30 s from the `SSRF_PROTECTION_ENABLED` and `SSRF_ALLOWED_ADDRESSES` rows.
- CE and Cloud never publish the runtime key, so every SSRF check keeps its env-var behaviour (`SSRF_PROTECTION_ENABLED`, `SSRF_DNS_RESOLUTION_CHECK`, `SSRF_BLOCKED_SCHEMES`). The SSRF endpoints return 404 there.

## Invariants & gotchas

- Runtime key name is identical in three copies: `plugins/packages/common/lib/ssrf-protection.ts`, `marketplace/plugins/common/lib/ssrf-protection.ts`, `server/src/helpers/ssrf-protection.helper.ts`. Change all or none.
- When the key is present, env vars are ignored: DNS resolution check always on, fixed blocked-scheme list, private ranges (10/8, 172.16/12, 192.168/16) blocked, no `localhost` exemption.
- An allowlist match skips every check, including the SSRF-safe `lookup` hook.
- Allowlisted addresses are reachable by anyone who can run a query, including through public apps; the settings UI says so.
- Fail closed: before the first successful read the publisher sets `{ enabled: true, empty allowlist }`. A change takes up to 30 s to apply.
- Allowlist: max 200 entries, trimmed and lowercased, CIDR `/0` rejected.
- Rows are `type: system`, seeded by a data migration; the SSRF keys must not be added to `BASIC_PLAN_SETTINGS` (no licence gate).
- Test connection runs the SSRF check for every data source kind; only the built-in database drivers in `SSRF_UNCHECKED_DATABASE_KINDS` (`data-sources/util.service.ts`) skip the `host` check (see `data-sources/AGENTS.md`).

## Related modules

- `data-sources` — test connection and query execution call the SSRF check.
- `plugins/packages/common` — shared SSRF helper used by connectors.
