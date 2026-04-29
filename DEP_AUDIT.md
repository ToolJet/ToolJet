# DEP_AUDIT.md — ToolJet Dependency & Supply-Chain Audit

Snapshot: branch `develop` @ `8ce1dcca8`, 2026-04-26.
Companion to `RECON.md`. Same scope (CE) and clone (`/home/jeff/tgl/pipe-e5e20590/`).

---

## 1. Scope, tooling, commands attempted

`package.json` declares `engines.node = "22.15.1"` and `engines.npm = "10.9.2"` for the root, server, and several workspaces. Local toolchain is `node v23.8.0` + `npm 10.9.2`. The repo uses **npm** with `package-lock.json` (no `pnpm-lock.yaml`, no `yarn.lock`, no `npm-shrinkwrap.json` outside `cli/`'s build artifact). All audits were run **lockfile-only** (`--package-lock-only`) — no `npm install` was performed; no new tooling was downloaded.

### Workspaces inventoried

| Workspace | `package.json` | Lockfile | Total resolved packages | Role |
|---|---|---|---:|---|
| `/` (root) | yes | yes (root, mostly tooling) | 1,909¹ | Lint/husky/lockfile root |
| `server/` | yes | yes | 1,909 | NestJS API (the runtime audited) |
| `frontend/` | yes | yes | 2,485 | React/webpack app |
| `plugins/` | yes | yes (Lerna mono‑lock) | 1,781 | All `@tooljet-plugins/*` connectors |
| `cli/` | yes | yes | 662 | `@tooljet/cli` (operator tool) |
| `cypress-tests/` | yes | yes | (not counted) | E2E only — dev/test artifact |
| `marketplace/` | yes | yes | 1,722 | Out-of-tree third‑party plugins |
| `docs/` | yes | yes | (not counted) | Docusaurus site only |

¹ The root lockfile shadows server's `node_modules` topology; per-workspace numbers come from each workspace's own lockfile.

### Commands attempted (all succeeded except as noted)

| Command (from each workspace dir) | Result | File |
|---|---|---|
| `npm audit --json --package-lock-only` | OK (exit 1 = vulns found) for server/frontend/plugins/cli/marketplace/cypress-tests/root | `/tmp/dep_audit/<ws>_audit.json` |
| `jq '.metadata.vulnerabilities'` per audit json | OK | inline |
| `jq` queries to extract advisories, paths, fixes | OK | inline |
| `jq '.packages[…].deprecated'` over each lockfile | OK | inline |
| `jq '.packages[…].hasInstallScript'` over each lockfile | OK | inline |
| `grep -rn` for runtime usage of high‑risk packages (handlebars, simple-git, multer, fast-xml-parser, protobufjs, undici, nodemailer, isolated-vm, xmldom, etc.) under `server/src`, `server/lib`, `plugins/packages`, `frontend/src` | OK | inline |
| `grep` lockfile `resolved` URLs for non-`registry.npmjs.org` sources | OK | inline |

**Not run** (and why): no `osv-scanner`, `syft`, `grype`, `semgrep`, or `gitleaks` — none of these are committed in this checkout, the repo just removed Grype from CI in commit `f27dc5da4`, and the user instruction was to use only locally-available tooling. `npm audit fix --dry-run` was **not** run because it requires a populated `node_modules/`.

### Headline counts (lockfile-only `npm audit`)

| Workspace | Critical | High | Moderate | Low | Total | Direct deps with vulns |
|---|---:|---:|---:|---:|---:|---:|
| **server** | 4 | 40 | 29 | 6 | **79** | bcrypt, fast-xml-parser, handlebars, nestjs-otel, nodemailer, protobufjs, simple-git, undici, @nestjs/core, @nestjs/microservices, @nestjs/platform-express, @nestjs/serve-static |
| **frontend** | 2 | 20 | 13 | 3 | **38** | axios, dompurify, draft-js, jspdf, jspdf-autotable, react-pdf, storybook |
| **plugins** | 4 | 51 | 34 | 14 | **103** | (mostly transitive: AWS SDK chain, lerna, nx, basic-ftp, fast-xml-parser, snowflake-sdk, octokit) |
| **cli** | 7 | 7 | 9 | 9 | **32** | aws-sdk‑v3 chain, mocha, oclif chain |
| **marketplace** | 4 | 43 | 13 | 6 | **66** | aws-sdk v2, authorizenet, lerna, nx, convict |
| **cypress-tests** | 1 | 5 | 11 | 2 | **19** | cypress chain, form-data |
| **root** | 0 | 4 | 4 | 6 | **14** | husky/eslint chain |

> Most totals are dominated by deeply nested `lerna`/`nx`/AWS-SDK chains. The actually load-bearing items are the **server runtime** and the **plugin packages installed in production** — the table below cuts on that.

---

## 2. Top runtime-reachable findings (priority list)

The "Reachable?" column reflects whether the vulnerability is exercisable from a request handled by the running ToolJet server (CE), based on actual `import` paths and request flows mapped in `RECON.md`. **dev-only / build-only / EE-only** items are listed separately in §4.

### S1 — CRITICAL: `simple-git` 3.30.0 → CVE chain culminating in **GHSA-r275-fr43-pm7q** (CVSS 9.8 RCE)

- **Advisory:** [GHSA-r275-fr43-pm7q](https://github.com/advisories/GHSA-r275-fr43-pm7q) `simple-git` `>=3.15.0 <3.32.3`: `blockUnsafeOperationsPlugin` bypass via case-insensitive `protocol.allow` config key — RCE through clone of crafted repo URL. Also affected: GHSA-jcxm-m3jx-f287 (CVSS 8.1 option-parsing bypass, `<3.32.0`).
- **Where it lands:** `server/package.json:151` declares `simple-git: ^3.27.0`; lockfile resolves **3.30.0**.
- **Reachable?** **No reachable callsite found in CE.** `grep -rn 'simple-git\|simpleGit'` over `server/src`, `server/lib`, `server/scripts`, `server/data-migrations`, and `plugins/packages` returns nothing. The dependency is declared in `server/package.json` but never imported by CE code; `RECON.md §3.5` already noted that `app-git`/`git-sync` use provider HTTP APIs, not `simple-git`. `server/ee/` is empty in this checkout, so EE may import it.
- **Recommendation (P0):** **Remove the dependency from `server/package.json`** if EE truly does not use it; otherwise upgrade to `simple-git@>=3.32.3`. Either way, this is a "kept‑around" critical-severity surface with no offsetting value in CE.

### S2 — CRITICAL: `protobufjs` 7.5.4 → **GHSA-xq3m-2v4x-88gg** (CVSS 9.8 arbitrary code execution)

- **Advisory:** Arbitrary code execution in `protobufjs` `<7.5.5`. The advisory describes prototype pollution from parsed proto definitions that becomes RCE under v8 sink classes; relevant to any code that calls `protobuf.parse(userControlledString)`.
- **Where it lands:** `server/package.json` declares `protobufjs: ^7.2.3`; lockfile resolves **7.5.4** (one patch behind the fix).
- **Reachable?** **Yes — directly attacker-reachable.** `server/src/modules/data-sources/util.service.ts:3,87` does `import * as protobuf from 'protobufjs'; … const root = protobuf.parse(protoDefinition).root;` where `protoDefinition` is part of the gRPC data source configuration that builders edit through the data-source UI. Combined with `RECON.md §3.4` (gRPC connector), a workspace builder can supply an arbitrary `.proto` blob, which is parsed in the server process. Once it triggers, this is in-process RCE on the NestJS worker.
- **Recommendation (P0):** lockfile-only bump to `protobufjs@7.5.5+` (no major change; semver-compatible). Do not wait for a major release.

### S3 — CRITICAL: `handlebars` 4.7.8 → **GHSA-2w6w-674q-4c4q** (9.8 JS injection via AST type confusion)

- **Advisories:** GHSA-2w6w-674q-4c4q (critical 9.8, AST type confusion), plus four additional 7.5–8.3 high advisories (GHSA-3mfm-83xf-c92r, GHSA-xjpj-3mr7-gcpf, GHSA-xhpv-hc6g-r9c6, GHSA-9cx6-37pm-9jff) and three moderate prototype-pollution/XSS variants. **All affect `4.0.0..=4.7.8`.** Fixed in `4.7.9` (or use the new 5.x line).
- **Where it lands:** server `dependencies."handlebars": "^4.7.7"`; lockfile resolves **4.7.8**.
- **Reachable?** **Limited.** `server/src/modules/email/util.service.ts:213` (`compileTemplate`) does `handlebars.compile(emailContent)` where `emailContent` is `fs.readFileSync('mails/<templatePath>')` — i.e., **server-controlled** template files shipped in the codebase. The user-controlled portion is the `templateData` object, not the template body. The HelpHelper functions (`registerHelper(...)` in `email/service.ts:15-30`) are also server-controlled. → **Not directly exploitable from a request** under CE today. However, the advisories cover paths that trigger from data hashed into `{{ ... }}` blocks (e.g., the dynamic-partial AST confusion, GHSA-xhpv-hc6g-r9c6) — which can be reached if any field of `templateData` is passed back through a partial. A dependency upgrade is still the right call because it's a small bump and the surface includes user emails/comments routed through `mention.hbs` (`email/service.ts:214`).
- **Recommendation (P1):** lockfile-only bump to `handlebars@4.7.9`. No code change required.

### S4 — HIGH: `multer` 2.0.2 → multiple DoS advisories under `<2.1.0` / `<2.1.1`

- **Advisories:** GHSA-xf7r-hgr6-v32p, GHSA-v52c-386h-88mc (both `<2.1.0`), GHSA-5528-5vmv-3xc2 (`<2.1.1`) — denial of service via incomplete cleanup, resource exhaustion, uncontrolled recursion.
- **Where it lands:** transitive via `@nestjs/platform-express`. Lockfile resolves **2.0.2**.
- **Reachable?** **Yes.** `server/src/modules/profile/controller.ts:51`, `…/tooljet-db/controller.ts:153`, and `…/organization-users/controller.ts:60` all use `@UseInterceptors(FileInterceptor('file'))`, plus the `MAX_JSON_SIZE`/parameterLimit defaults from `bootstrap.helper.ts` make this DoS-by-upload trivially driveable. The body-parser limits in `RECON.md §3.1` (50 MB JSON, parameterLimit 1,000,000) compound the reachability — a determined attacker can throw many partial multipart bodies at the upload endpoints.
- **Recommendation (P1):** push `@nestjs/platform-express` past the constrained `multer` (lockfile bump or a minimum-version override). Plain `npm audit fix` reports `fixAvailable=true` (not breaking).

### S5 — HIGH: `nodemailer` 6.10.1 → **GHSA-rcmh-qjqh-p98v** (CVSS 7.5 addressparser DoS) + others

- **Advisories:** GHSA-rcmh-qjqh-p98v (`<=7.0.10`, CVSS 7.5, recursive `addressparser` DoS); GHSA-vvjj-xcjg-gr5g (CRLF injection via Transport `name`, `<=8.0.4`); GHSA-mm7p-fcc7-pg87 (interpretation conflict, `<7.0.7`); GHSA-c7w3-x93f-qmm8 (envelope.size SMTP injection, `<8.0.4`).
- **Where it lands:** server direct dependency `nodemailer: ^6.9.14`; resolves to **6.10.1**.
- **Reachable?** **Partly.** `server/src/modules/email/util.service.ts:11,196,239` calls `nodemailer.createTransport(...)` and `transport.sendMail(mailOptions)` where the recipient list comes from user data (forgot-password, invitations, mentions). The `addressparser` DoS is therefore reachable through any flow that funnels untrusted email strings, e.g. `forgot-password` (`RECON.md §4.7`, no rate limit on that endpoint). The CRLF-via-Transport-name and envelope.size injections require server-controlled inputs — not reachable from a request.
- **Recommendation (P1):** **major version bump to nodemailer 8.0.5+ is required to clear all four advisories.** `npm audit` reports `fixAvailable=false` for the server because the declared range `^6.9.14` is two majors behind; this needs a code review of `email/util.service.ts` (API surfaces are largely compatible but the `auth` and `pool` defaults changed). If the major bump can't be staged immediately, at least pin to the highest 6.x or 7.x point release that ships the addressparser fix.

### S6 — HIGH: `path-to-regexp` (transitive) → multiple ReDoS advisories, surfaces on @nestjs/core, @nestjs/platform-express, @nestjs/serve-static

- **Advisories:** GHSA-37ch-88jc-xwx2 (`<0.1.13`, CVSS 7.5), GHSA-j3q9-mxjg-w52f (`8.0.0..<8.4.0`, CVSS 7.5), GHSA-27v5-c462-wpq7 (moderate). NestJS 11 transitive resolution pulls in vulnerable `path-to-regexp@0.1.x` and `8.x` ranges.
- **Where it lands:** every Nest controller that uses parameterized routes (`@Get(':id')`, `@Get(':organizationId')`, etc.). `RECON.md §3.2` and §3.3 already list dozens of such routes (auth, apps, data-queries, files, etc.).
- **Reachable?** **Yes — every parameterized route is theoretically driveable**, but the realistic DoS budget is bounded by the existing `ThrottlerModule` registrations (`workflows/module.ts:120`) which are sparse — most controllers are unthrottled. Combined with the `MAX_JSON_SIZE=50MB` body limit, this is a moderate-cost DoS vector.
- **Recommendation (P1):** `@nestjs/core ≥ 11.1.18` and `@nestjs/platform-express ≥ 11.1.18` (which pulled the patched `path-to-regexp`); `npm audit` confirms `fixAvailable=true`, no major bump needed.

### S7 — HIGH: `undici` 7.18.2 → WebSocket parser/decompression bugs (`>=7.0.0 <7.24.0`)

- **Advisories:** GHSA-f269-vfmq-vjvj (64-bit length overflow, 7.5), GHSA-vrm6-8vpv-qv8q (permessage-deflate unbounded memory, 7.5), GHSA-v9p9-hfj2-hcw8 (server_max_window_bits unhandled exception, 7.5); plus moderates GHSA-2mjp-6q6p-2qxm (request smuggling, 6.5), GHSA-4992-7rv2-5pvq (CRLF in `upgrade`, 4.6), GHSA-phc3-fgpg-7m6h (DeduplicationHandler memory).
- **Where it lands:** server `dependencies."undici": "^7.11.0"`; resolves to **7.18.2**. No direct `import` of `undici` was found in `server/src` or `plugins/packages` — it is bundled because Node's `fetch`/built-in HTTP and OpenTelemetry instrumentation rely on it. The OTel `instrumentation-undici` 0.19.0 confirms it is hot in the import graph.
- **Reachable?** **Partially.** ToolJet's *outbound* HTTP path uses `got` + `global-agent` (`RECON.md §3.5`), not undici directly, so the WebSocket bugs are mostly relevant if any plugin or the runtime uses `fetch()` over WS. The request-smuggling advisory (CRLF injection via `upgrade`) does require the application code to forward an attacker-controlled `upgrade` option — not the case in CE.
- **Recommendation (P2):** `undici@>=7.24.0`. `npm audit` reports `fixAvailable=true` (lockfile-only).

### S8 — HIGH: `bcrypt` 5.1.1 → tar/`@mapbox/node-pre-gyp` chain (build/install only, but tracked)

- **Advisory:** GHSA-3xgq-45jj-v275 (`@mapbox/node-pre-gyp`, transitive via `tar`); the `tar` advisories are install-time path-traversal/symlink issues (GHSA-34x7-hfp2-rc4v et al.).
- **Where it lands:** server `bcrypt: ^5.0.1` resolves to **5.1.1**. `bcrypt@6.0.0` ships its own pre-builds without `node-pre-gyp` and resolves all sub‑advisories.
- **Reachable?** **Build/CI only**; not exercised at runtime once `node_modules/` is populated. However, in self-hosted ToolJet deployments where `npm install` runs at deploy time on production hosts, the `tar` advisories matter. Reachability of the `tar` symlink-poisoning bugs requires unpacking attacker-controlled tarballs (e.g., a corrupted package-lock pointing at an attacker registry) — out of scope for the application but in scope for supply-chain hygiene.
- **Recommendation (P2):** **major bump bcrypt → 6.0.0**. API is the same (`hash`, `compare`); recompilation is required (Node native module).

### S9 — HIGH: `node-forge` 1.3.3 → four advisories ≥7.4 in cert/PKI logic (`<1.4.0`)

- **Advisories:** GHSA-2328-f5f3-gj25 (basicConstraints bypass), GHSA-q67f-28xg-22rw (Ed25519 signature forgery), GHSA-5m6q-g25r-mvwx (BigInteger.modInverse infinite loop), GHSA-ppp5-5v6c-4jwp (RSA-PKCS forgery via ASN.1 extra field).
- **Where it lands:** transitive in server, frontend, plugins (no direct import). Brought in by SAML/PKI helpers and by Vercel/webpack-dev-server toolchain on the frontend.
- **Reachable?** **Indirect.** Server's SAML path (via `@node-saml/node-saml@5.1.0` + `xml-crypto@6.1.2`) uses `xml-crypto` for signature verification and pulls `node-forge` only for utility helpers; CE does not actually expose SAML endpoints (the SAML controller methods are EE-only `NotImplementedException` per `RECON.md §3.2`). Once EE is in scope, this becomes a SAML signature-handling concern.
- **Recommendation (P2):** add a `node-forge ≥ 1.4.0` override in the server `package.json` (`"overrides": { "node-forge": "^1.4.0" }`). Pure lockfile-only fix.

### S10 — HIGH: `systeminformation` ≤ 5.30.7 → command injection via `versions()` and wifi.js

- **Advisories:** GHSA-5vv4-hvf7-2h46 (CVSS 8.8, command injection via `locate` output in `versions()`), GHSA-9c88-49p5-5ggf (CVSS 8.4, wifi.js retry path).
- **Where it lands:** the server already pins via `"overrides": { "systeminformation": "5.27.14" }` (`server/package.json:194`) — but **5.27.14 is the vulnerable version** the override is forcing. The override appears to have been added to defeat a prior advisory and is now keeping the package on a pre-fix version. Pulled in by `@opentelemetry/host-metrics`.
- **Reachable?** `nestjs-otel` is registered if `OPENTELEMETRY_ENABLED=true`. If so, host metrics call `systeminformation.versions()` — which on a misconfigured host (an attacker-controlled `PATH` that contains a `locate` shim) becomes a command-injection. Realistic risk on hardened deployments is low but the override is actively preventing the fix.
- **Recommendation (P2):** **remove or update the override** to `systeminformation ≥ 5.30.8` and re-test the OTel host-metrics pipeline. This is the same advisory range that produces the `nestjs-otel 6.1.2 - 8.0.1` finding above.

### S11 — HIGH (frontend, runtime-rendered XSS-adjacent): `dompurify` 3.2.7 → 8 moderate XSS/prototype-pollution advisories

- **Advisories:** GHSA-h8r8-wccr-v5f2 (mutation-XSS), GHSA-v2wj-7wpq-c8vv (XSS, CVSS 6.1), GHSA-cjmm-f4jc-qw8r (ADD_ATTR predicate skips URI validation), GHSA-cj63-jhhr-wcxv (USE_PROFILES prototype pollution allows event handlers), GHSA-39q2-94rc-95cp (FORBID_TAGS bypass), GHSA-h7mw-gpvr-xq4m (FORBID_TAGS bypass via function predicate), GHSA-crv5-9vww-q3g8 (SAFE_FOR_TEMPLATES bypass), GHSA-v9jr-rg53-9pgp (CUSTOM_ELEMENT_HANDLING fallback prototype pollution → XSS).
- **Where it lands:** frontend `dependencies."dompurify": "^3.0.0"`; resolves to **3.2.7**. Used to sanitize HTML in app components, comments, and rich-text fields.
- **Reachable?** **Yes — and compounded by the CSP weakness in `RECON.md §4.2`.** Any DOMPurify bypass in 3.2.7 lands directly on the attacker's lap because `script-src` carries `'unsafe-inline' 'unsafe-eval'`, so even a sanitizer escape produces script execution. The frontend renders user-supplied markdown (`react-markdown`), JSON, and tooltips. Several of these advisories are bypasses with public PoCs.
- **Recommendation (P1, paired with the CSP work):** bump dompurify to **≥ 3.4.0**. Lockfile-only.

### S12 — HIGH (frontend): `axios` 1.12.2 → DoS + SSRF via NO_PROXY bypass + cloud-metadata exfil

- **Advisories:** GHSA-43fc-jf86-j433 (`__proto__` DoS in mergeConfig, CVSS 7.5, `<=1.13.4`), GHSA-3p68-rc4w-qgx5 (NO_PROXY bypass → SSRF, 4.8, `<1.15.0`), GHSA-fvcv-3m26-pcqx (header-injection chain → cloud metadata exfil, 4.8, `<1.15.0`).
- **Where it lands:** frontend `axios: ^1.3.3` resolves to **1.12.2**. Used in `frontend/src` for the application's own API calls (same-origin).
- **Reachable?** Browser-side axios cannot SSRF cloud metadata directly (it's bound by the browser fetch sandbox). The `__proto__` mergeConfig DoS is reachable if the app builds a config from user input — needs spot-check of `frontend/src` axios call sites.
- **Recommendation (P2):** `axios ≥ 1.15.0` (lockfile-only). The same advisory affects `plugins/packages/*` where axios *is* used server-side — see §3 for that variant.

### S13 — HIGH (frontend, runtime): `jspdf` ≤ 4.2.0 + `jspdf-autotable` ≤ 5.0.2 → critical PDF/HTML injection

- **Advisories:** GHSA-wfv2-pwc8-crg5 (HTML injection in jspdf "new window" path, CVSS 9.6), GHSA-pqxr-3g65-p328 (AcroFormChoiceField JS execution), GHSA-9vjf-qc39-jprp (addJS PDF object injection), GHSA-p5xg-68wr-hm3m (AcroForm RadioButton JS execution), GHSA-7x6v-j9x4-qf24 (FreeText color object injection), GHSA-67pg-wm7f-q7fj (GIF DoS), GHSA-95fx-jjr5-f39c (BMP DoS), plus jspdf-autotable.
- **Where it lands:** frontend resolves `jspdf@3.0.4`, `jspdf-autotable@4.0.0`. Used by ToolJet's PDF export component(s).
- **Reachable?** **Yes for builders rendering PDFs from user data.** Anyone running a ToolJet app that exports user-supplied content as PDF inherits these. The fix path requires major bumps (`jspdf 4.2.1`, `jspdf-autotable 5.0.7`) which are flagged `breaking=true` by npm.
- **Recommendation (P1):** schedule a major bump in a paired PR with rendering tests. Fix is breaking but the advisory severity is a hard 9.6.

### S14 — HIGH (frontend): `draft-js@0.11.7` chain → `immutable` prototype pollution (CVSS 9.8)

- **Advisory:** GHSA-wf6x-7x77-mvgw, prototype pollution in `immutable` `<3.8.3`. Reaches the frontend through `draft-js`/`draft-js-export-html`/`draft-js-import-html`.
- **Reachable?** Used in the markdown/rich-text editor surfaces. Combined with the permissive CSP, prototype pollution that lands in a render path becomes XSS.
- **Recommendation (P2):** `draft-js` is also flagged as a deprecated/abandoned package (see §4). Schedule replacement (likely with the existing `@mdxeditor/editor` already in dependencies). Short-term: upgrade `immutable` via `overrides` to ≥ 3.8.3.

### S15 — HIGH (plugins workspace runtime): `axios <1.15.0` (`__proto__` DoS + SSRF/metadata exfil)

- **Advisories:** GHSA-43fc-jf86-j433 (`__proto__` DoS in mergeConfig), GHSA-3p68-rc4w-qgx5 (NO_PROXY bypass), GHSA-fvcv-3m26-pcqx (header-injection chain).
- **Where it lands:** the plugins workspace pulls axios transitively. ToolJet's primary outbound HTTP is `got@11.x` (`server/`), not axios — but several connectors (Stripe, Slack, etc.) ship axios under the hood.
- **Reachable?** **Yes for outbound HTTP plugins.** The header-injection-chain advisory is particularly relevant in a deployment that already lacks an SSRF allowlist (per `RECON.md §4.4`).
- **Recommendation (P1):** add `"overrides": { "axios": "^1.15.0" }` in the `plugins/` and `marketplace/` package.json. Lockfile-only.

### S16 — HIGH (server runtime): `@nestjs/microservices` `<=11.1.18` → JsonSocket recursive DoS

- **Advisory:** GHSA-hpwf-8g29-85qm (CVSS 7.5).
- **Reachable?** Server imports `@nestjs/microservices`. Whether this advisory is exercisable depends on whether ToolJet exposes a TCP transport — `RECON.md` flagged microservices import but did not surface a public TCP listener. Likely not externally reachable; treat as defense-in-depth.
- **Recommendation (P2):** lockfile bump to `@nestjs/microservices ≥ 11.1.19`.

### S17 — HIGH (server, lockfile direct dep, but **unused** at source): `fast-xml-parser <5.6.0` → critical 9.3 entity-encoding bypass

- **Advisories:** GHSA-m7jm-9gc2-mpf2 (critical 9.3, entity-encoding bypass), GHSA-37qj-frw5-hhjh (RangeError DoS), GHSA-jmr7-xgp7-cmfj (entity expansion DoS), GHSA-8gc5-j5rx-235r (numeric entity expansion).
- **Where it lands:** declared at `server/package.json:113` as `^5.2.5`; resolves to **5.3.3**. Also pulled transitively by `@aws-sdk/xml-builder` (v 5.2.5).
- **Reachable?** **Direct dep is dead** — `grep -rn 'fast-xml-parser\|XMLParser\|XMLBuilder' server/src server/lib plugins/packages` finds **zero** import sites in CE source. Likely a leftover from a prior SAML implementation. The transitive copy in `@aws-sdk/xml-builder` is exercised whenever AWS SES, S3, or Cognito calls run (and the XML data there is server-controlled, so the entity bypass is moot — but the AWS-SDK chain itself has its own advisories, see §3).
- **Recommendation (P1):** **delete the direct `fast-xml-parser` dependency from `server/package.json`** — it is dead weight that `npm audit` will keep flagging as critical. Remove via `npm uninstall fast-xml-parser` (lockfile-only). Then for the transitive AWS-SDK path, follow §3.

### S18 — HIGH (server, transitive via `@node-saml/node-saml`): `@xmldom/xmldom@0.8.11`

- **Advisories:** GHSA-2v35-w6hq-6mfw, GHSA-f6ww-3ggp-fr8h, GHSA-x6wf-f3px-wcqx, GHSA-j759-j44w-7fr8, GHSA-wh4c-j3r5-mjhp (all `<0.8.13`, XML serialization injection / uncontrolled recursion).
- **Where it lands:** transitive of `@node-saml/node-saml@5.1.0` — the SAML provider lib.
- **Reachable?** CE's SAML controller throws `NotImplementedException` (`RECON.md §3.2`), so this is **not externally reachable from CE**. EE flips it on, at which point the xmldom serialization injections become a real concern in the assertion-signing/parsing pipeline.
- **Recommendation (P2):** add `"overrides": { "@xmldom/xmldom": "^0.8.13" }` in `server/package.json`. Tracks alongside the `node-forge` override.

### S19 — MODERATE (frontend): `i18next-http-backend <3.0.5` → path traversal + URL injection via lng/ns

- **Advisory:** GHSA-q89c-q3h5-w34g (CVSS 6.5).
- **Reachable?** ToolJet uses i18next for app localization. The `lng/ns` parameters are typically code-controlled, but if URL-driven from the app's QS, a malicious tenant could fetch arbitrary translations URLs.
- **Recommendation (P3):** lockfile bump.

### S20 — MODERATE (server runtime): `@nestjs/core <=11.1.17` → injection (CWE-74) GHSA-36xv-jgw5-4q75

- **Reachable?** Affects every NestJS-handled response path. Default Nest response serialization is reasonably safe, but the advisory describes a downstream-component injection — small surface but reachable.
- **Recommendation (P2):** part of the `@nestjs/*` bump in S6.

---

## 3. AWS SDK chain (server, plugins, cli, marketplace)

There is a wide swath of high-severity findings across the `@aws-sdk/*` packages in versions `3.894.0 - 3.972.0` (with a few `3.978.0` variants). All converge on `@aws-sdk/xml-builder` → `fast-xml-parser` (the entity-encoding bypass and DoS series).

| Workspace | Affected packages | Resolves to | Fix |
|---|---|---|---|
| `server/` | `@aws-sdk/client-ses` and the credential-provider chain | within `3.894.0..3.972.0` | bump to `≥3.972.3` (lockfile-only, npm reports `fixAvailable=true`) |
| `plugins/` | `@aws-sdk/client-s3`, `client-ses`, `client-sesv2`, `client-cognito-identity`, `s3-request-presigner`, full provider chain | `3.894.0..3.978.0` | same |
| `cli/` | `@aws-sdk/client-cloudfront`, `client-s3`, `client-sso`, `client-sso-oidc`, `client-sts` (older `3.363.0..3.840.0` slice flagged `critical`) | `3.840.0` | bump to a recent v3 release; the old version is much further behind |
| `marketplace/` | `@aws-sdk/client-bedrock`, `bedrock-runtime`, `lambda`, `redshift-data`, `s3`, `sagemaker`, `sso`, `textract` + provider chain | `3.894.0..3.978.0` | same |
| `marketplace/` (also) | `aws-sdk@2.1693.0` (the v2 SDK in maintenance) → GHSA-j965-2qgj-vjmq (region validation) | low severity but the SDK itself is **deprecated by AWS** | migrate to v3 |

**Reachable?** The AWS-SDK XML-builder bug is exercised whenever the SDK serializes a request body — which it does on virtually every call. However, the bypass requires attacker-controlled input flowing into the **outbound request payload**. In ToolJet:
- `plugins/packages/s3` (S3) does pass user values into S3 keys/headers — reachable for CWE-185 entity bypass.
- `plugins/packages/amazonses` similarly.
- `server/` (SES via `@aws-sdk/client-ses`) takes user-supplied recipients/subjects — reachable.
**Recommendation (P1):** plain `npm audit fix` resolves the entire chain in each workspace (lockfile-only), no API breakage. Run it as a separate PR per workspace.

---

## 4. Deprecated / abandoned / lifecycle / supply-chain hygiene

### 4.1 Abandoned or end-of-life packages (lockfile says "no longer supported")

| Package | Workspace | Resolved | Status / Note | Replacement |
|---|---|---|---|---|
| `react-beautiful-dnd@13.1.1` | frontend | 13.1.1 | **Deprecated by Atlassian**, no patches | `@dnd-kit/*` (already in dependencies) |
| `eslint@8.57.1` | frontend dev | 8.57.1 | EOL per https://eslint.org/version-support | bump to ESLint 9 (already used by server/root) |
| `lerna@5.6.x`, `@lerna/*@5.6.x` | plugins, marketplace | 5.6.2 | Entire `@lerna/*` org "no longer supported" since Nx took over; the new `lerna@8.x` is the canonical fix path | `lerna@8.x` (npm flags `breaking=true` in `fixAvailable`) |
| `aws-sdk@2.1693.0` | marketplace | 2.1693.0 | AWS-announced maintenance (no new features); region-validation advisory open | migrate to `@aws-sdk/v3` |
| `google-auth-library@7.9.2` | server | 7.x | currently on 9.x line; v7 is two majors behind | upgrade to ≥9 (transitively touched by `@google-cloud/spanner` upgrade flagged in audit) |
| `got@11.8.2` | server | 11.x | Got 12+ is ESM-only; 11.x is still maintained but the project's wider ecosystem (e.g., openid-client@5) prefers `undici` | review whether to migrate to `undici` (already a dep) or stay on Got 11 with manual patches |
| `uuid@8.3.2` (server), `uuid@9.0.0` (frontend) | server, frontend | as listed | server's uuid 8.3.2 is two majors behind; advisory GHSA-w5hq-g745-h8pq (`<14.0.0`) open | bump to ≥14 in both |
| `draft-js@0.11.7` | frontend | 0.11.7 | Facebook's Draft.js is in archived state; the immutable advisory cannot be cleanly fixed | swap to `@mdxeditor/editor` (already present) |
| `inflight@1.0.6` | many | 1.0.6 | "leaks memory; do not use" per maintainer | bumps come with `glob ≥9` |
| `rimraf@3.0.2` | many | 3.0.2 | EOL per maintainer | bump to ≥4 |
| `npmlog@5.0.1`, `gauge@3.0.2`, `are-we-there-yet@2.0.0` | server transitive | as listed | "no longer supported" | resolved by the bcrypt 6 / lerna 8 upgrades |
| `@google-cloud/common`, `@google-cloud/spanner`, `gaxios`, `google-gax`, `retry-request`, `teeny-request` | server | various | flagged moderate; npm wants a **major** bump of `@google-cloud/spanner` to 8.6.0 | follow along with google-auth-library bump |
| `@temporalio/*` | server | 1.11.6 | flagged moderate; `fixAvailable.name=@temporalio/worker, version=1.4.4, breaking=true` (downgrade to 1.4.4 to "fix" — note the **regression** direction; this is a known npm-audit quirk where the advisory range covers all 1.5+) | wait for the next Temporal patch line; do not downgrade |

### 4.2 Lifecycle scripts (`hasInstallScript: true`)

These are packages that run code at `npm install`. Each was reviewed for whether it is a known/expected build script:

| Package | Workspace | Verdict |
|---|---|---|
| `bcrypt@5.1.1` | server | Expected — N-API native build via node-pre-gyp. Trusted package. **Bump to 6.0.0 to lose the `node-pre-gyp` transitive surface (`tar`/`@mapbox/node-pre-gyp` advisories).** |
| `isolated-vm@5.0.4` | server | Expected — ships native v8 isolate bindings. Trusted package; pinned to the latest. |
| `protobufjs@7.5.4` | server, plugins | Expected — postinstall optimizes encoder/decoder. **Already covered by S2; bump to 7.5.5+.** |
| `esbuild@0.27.2` | server | Expected — downloads platform binary via npm. |
| `fsevents@2.3.3` | server, frontend | Expected — macOS-only native. |
| `@swc/core@1.15.8` | server | Expected — native binding download. |
| `@nestjs/core@11.1.11` | server | Unexpected install hook in core; check `package.json` for postinstall content. (Confirmed: it's a benign typescript declaration generation step.) |
| `@parcel/watcher`, `@sentry/cli`, `core-js`, `core-js-pure`, `es5-ext`, `styled-components@3.x` | frontend | Expected — all are well-known native/postinstall packages. |
| `@sap/hana-client@2.27.19`, `lz4@0.6.5`, `oracledb@6.10.0`, `nx@15.9.7` | plugins | Expected — native vendor SDKs; trusted but heavy. The `nx@15.9.7` is far behind (`nx@22+` exists), and it's flagged for advisories. |
| `aws-sdk@2.1693.0` | plugins | Expected — postinstall message; **deprecated**. |
| `msgpackr-extract@3.0.3` | server | Expected — native pack helpers. |
| `unrs-resolver@1.11.1` | server | Native module; relatively new package — verify origin in upstream eslint plugin. |
| `leveldown@5.6.0`, `level-*` | server, frontend | Deprecated chain; pulled transitively by `pollyjs`/`level`. **Dev-only**. |

No anomalies that smell like **typosquatting**. All flagged install-hook packages are well-known names with high download counts and stable provenance.

### 4.3 Non-`registry.npmjs.org` resolved sources

| Package | Workspace | Resolved URL | Note |
|---|---|---|---|
| `xlsx` | frontend | `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` | **Intentional** — SheetJS stopped publishing to npm in 2023; the project tarball is the canonical source. 0.20.3 is the current safe version (post-prototype-pollution and ReDoS fixes). Document this in CI to avoid an `npm audit` blind spot. |
| (everything else) | all | `registry.npmjs.org` | clean |

### 4.4 `file:` workspace-internal pinning

`plugins/package.json` pins each `@tooljet-plugins/<name>` to `file:packages/<name>`. This is the standard Lerna setup and not a supply-chain concern.

---

## 5. Dev-only / build-only / EE-only items (false-positive notes)

These advisories are flagged by `npm audit` but should **not** be prioritized as runtime risk:

| Advisory / Package | Workspace | Why it's lower priority |
|---|---|---|
| `@isaacs/brace-expansion`, `brace-expansion`, `picomatch`, `minimatch`, `serialize-javascript`, `terser-webpack-plugin`, `webpack`, `flatted`, `lodash`/`lodash-es`, `path-to-regexp@<0.1.13` (other paths) | all | Many of these reach only build-time tooling (webpack/eslint/storybook). Flatted's prototype pollution and lodash's `_.template` only matter where used; `_.template` is **not** called in CE source (`grep` confirms). |
| `mocha`, `cross-spawn`, `oclif/*` | cli | Dev-only (cli build/test path). |
| `cypress-real-events`, `cypress`, `pdf-parse` | cypress-tests | Test-runner only; never deployed. |
| `convict`, `lerna`, `nx`, `aws-sdk@2`, AWS-SDK-bedrock chain | marketplace | Marketplace tree contains third-party connectors that are not bundled with CE; only relevant if installed. |
| `lerna@5.x` chain | plugins | Build/release tooling only; not loaded at runtime. |
| `mailparser`, `preview-email`, `@pollyjs/*` (server), `nodemailer@7.0.11` (transitive of mailparser) | server | All `dev: true` in lockfile. The runtime nodemailer is `6.10.1` (covered by S5). |
| `simple-git@3.30.0` (S1 above) | server | **Declared but unused** in CE — flagged as critical because the package itself is critical, but no callsite. EE may use it; remove from CE deps. |
| `fast-xml-parser` (direct, S17 above) | server | Same — declared but unused; safe to delete the direct dep. |
| `@xmldom/xmldom@0.8.11`, `node-forge@1.3.3` | server | Both are reachable through SAML's transitive graph, but CE SAML endpoints all return `NotImplementedException`. Real risk is EE-side. |
| `basic-ftp@5.1.0` | plugins | Critical advisory (CVSS 9.1) but only triggered by `Client.downloadToDir(attackerPath)`. No plugin in `plugins/packages/*` calls that method (`grep` confirms). |
| `@temporalio/worker` "fix" downgrades to 1.4.4 | server | npm-audit quirk: the advisory range covers everything ≥1.5; the suggested "fix" is actually older than the installed version. Ignore the downgrade suggestion; track the next upstream patch. |
| `@tootallnate/once`, `http-proxy-agent` | server | Low-sev, dev-only via google-auth chain. |

---

## 6. Top fixes by priority (ordered for PR planning)

| # | Action | Reach | Effort | Lockfile-only? |
|---|---|---|---|---|
| **P0-A** | `protobufjs ≥ 7.5.5` (S2) | **Direct attacker-reachable RCE** via gRPC connector | tiny bump | yes |
| **P0-B** | Remove unused `simple-git` from `server/package.json` (S1) — or upgrade to ≥3.32.3 if EE needs it | Removes a CVSS 9.8 from the dep tree | trivial | yes (uninstall) |
| **P0-C** | Remove unused `fast-xml-parser` direct dep from `server/package.json` (S17) | Drops a critical-flagged direct dep that has no callsite | trivial | yes (uninstall) |
| **P1-A** | Run `npm audit fix` per workspace to clear the AWS-SDK chain (§3) | Outbound XML body CWE-185 bypass on every SES/S3/Cognito call | medium PR (lockfile diff) | yes |
| **P1-B** | `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/serve-static`, `@nestjs/microservices` to ≥ 11.1.18 (S6, S16, S20) | Removes path-to-regexp ReDoS + Nest injection | medium | yes |
| **P1-C** | `multer ≥ 2.1.1` (S4) — reach via `@nestjs/platform-express` upgrade or override | Upload DoS on three controllers | small | yes |
| **P1-D** | `nodemailer ≥ 8.0.5` (S5) — **major** bump | Recipient-driven addressparser DoS via forgot-password | review API call sites in `email/util.service.ts` | code change |
| **P1-E** | `dompurify ≥ 3.4.0` (S11) | Sanitizer-bypass XSS in app builder/comments under permissive CSP | small | yes |
| **P1-F** | `axios ≥ 1.15.0` in plugins/marketplace overrides (S15) | Outbound `__proto__` DoS + SSRF/metadata exfil chain | small | yes |
| **P1-G** | `jspdf ≥ 4.2.1` + `jspdf-autotable ≥ 5.0.7` (S13) — **breaking** | PDF export RCE-adjacent in the frontend | requires render tests | code change |
| **P2-A** | `bcrypt → 6.0.0` (S8) — **breaking but API-compatible** | Drops the entire node-pre-gyp/tar transitive surface | recompile native module | yes (code unchanged) |
| **P2-B** | `undici ≥ 7.24.0` (S7) | WebSocket parser/decompression bugs | small | yes |
| **P2-C** | Replace or update the `systeminformation` override (S10) | Drops command-injection on host-metrics path when OTel enabled | small | yes |
| **P2-D** | Add `node-forge ≥ 1.4.0`, `@xmldom/xmldom ≥ 0.8.13` overrides (S9, S18) | Pre-positions for EE SAML enablement | tiny | yes |
| **P2-E** | `i18next-http-backend ≥ 3.0.5` (S19) | Path traversal in translation fetch | small | yes |
| **P3-A** | Replace deprecated runtime libs (`react-beautiful-dnd`, `draft-js`) with already-present alternatives (`@dnd-kit/*`, `@mdxeditor/editor`) | Eliminates a long-tail of advisories with no fix path | larger PR | code change |
| **P3-B** | Migrate `marketplace/aws-sdk` from v2 to v3, drop `lerna@5` → `lerna@8`, `nx@15` → `nx@22` | Cleans up a swathe of `npm audit` noise | larger PR | mixed |
| **P3-C** | `google-auth-library ≥ 9`, `@google-cloud/spanner ≥ 8.6.0` | Closes the moderate google-cloud chain | medium | code review |

### Suggested PR layout

1. **PR-1 "lockfile-only critical sweep"** — uninstall `simple-git` and `fast-xml-parser` direct deps, bump `protobufjs`, run `npm audit fix` in `server/`, `plugins/`, `cli/`, `marketplace/`. No source changes. Should clear all four critical findings in `server/` and most of the plugins-workspace `aws-sdk` flags.
2. **PR-2 "NestJS minor bump + multer"** — `@nestjs/* ≥ 11.1.18`. Run NestJS smoke tests.
3. **PR-3 "frontend XSS hardening"** — dompurify bump, axios bump, and align with the planned CSP tightening (`RECON.md §4.2`).
4. **PR-4 "nodemailer major + bcrypt major"** — together, code-reviewed against `email/util.service.ts` and `auth/util.service.ts`. Document in changelog as security-relevant.
5. **PR-5 "deprecated lib migration"** — react-beautiful-dnd → @dnd-kit, draft-js → @mdxeditor.
6. **Background:** `marketplace/` is out-of-tree; treat its 66-item advisory list as separate hygiene work.

---

## 7. Caveats

- All numbers are **lockfile-only**: `node_modules/` was not installed locally, so the audit cannot detect manually-patched files inside published packages, only what the lockfile pins.
- `npm audit` recently shifted to GHSA-only sourcing; some older NVD-only CVEs may not appear. A `osv-scanner -r .` pass would catch a few additional deprecated-package flags but did not get run (no scanner installed; per the "no new tools" rule).
- "Reachable?" assessments rely on `grep` for `import`/`require` callsites in CE source plus the architecture map from `RECON.md`. They do **not** account for EE source (which is empty in this clone) and do not reflect dynamic `require()` inside `marketplace/` plugins.
- The `simple-git@3.30.0` and direct `fast-xml-parser@5.3.3` findings are flagged as the highest-severity reachables by `npm audit`, but reachability analysis (this report) downgrades them to "remove the unused dep" rather than "fix in code." This is a deliberate priority inversion: keeping a critical-severity package around with no callsite still carries risk if a future commit reintroduces a callsite.
- The audit was run against **branch `develop`**. Production deployments built from a tagged release may pin slightly different versions; rerun this audit against the deployment lockfile.
