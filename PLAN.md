# PLAN

## 1. Summary of the issue and relevant follow-up comments

- GitHub issue: `ToolJet/ToolJet#16217` (`[Security] Critical: SCIM bearer auth bypass when token secret is unset`), opened by `parasol-aser`, currently `OPEN`.
- Live thread status as verified on `2026-04-29`: the issue body is present, but there are no public follow-up comments or timeline items. `gh issue view ... --comments` currently fails in this environment because the installed `gh` is still querying deprecated `projectCards`; the thread was verified with `gh api repos/ToolJet/ToolJet/issues/16217`, `.../comments`, and `.../timeline` instead.
- The issue matches the local finding `TJ-001`: when `SCIM_ENABLED=true` and `SCIM_HEADER_AUTH_TOKEN` is unset, the SCIM guard can treat malformed or empty bearer-style input as authenticated because it compares parsed `undefined` values directly.
- The vulnerable code is in [server/src/modules/scim/guards/scim-auth.guard.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/scim/guards/scim-auth.guard.ts). The current bearer/header-token branch does:
  `const token = authHeader.split(' ')[1]`
  `const validToken = this.configService.get<string>('SCIM_HEADER_AUTH_TOKEN')`
  `if (token === validToken || authHeader === validToken) return true`
- That means all of these can become dangerous when the configured token is unset:
  `Authorization: Bearer`
  `Authorization: anything-without-a-space`
  any other malformed header where `split(' ')[1]` becomes `undefined`
- The Basic branch also uses direct `===` comparisons and does no config completeness validation, but it does not reproduce the same practical bypass in the common unset-secret case.
- Important codebase context: SCIM features are marked `isPublic` in [server/src/modules/scim/constants/feature.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/scim/constants/feature.ts), and the shared [server/src/modules/app/guards/ability.guard.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/app/guards/ability.guard.ts) returns early for public features after license checks. In other words, SCIM route protection depends on `ScimAuthGuard`; if that guard fails open, the route is effectively unauthenticated.
- Additional structural context: [server/src/modules/scim/module.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/scim/module.ts) is the shared module class that is always imported by [server/src/modules/app/module.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/app/module.ts). It dynamically resolves CE vs EE implementations through `getProviders()`, so provider-level fixes here can apply across editions.
- Documentation context changes the recommended scope slightly from the local audit note: [docs/versioned_docs/version-3.16.0-LTS/user-management/sso/scim/overview.md](/home/jeff/tgl/pipe-e5e20590/docs/versioned_docs/version-3.16.0-LTS/user-management/sso/scim/overview.md) says ToolJet supports both Basic Authentication and Header Token Authentication and shows all SCIM auth env vars set together. Because of that, the safest compatible fix is not “exactly one auth mode”; it is “at least one complete auth mode, and no partial/broken auth config.”
- Limitation of this checkout: `server/ee/` is empty, so the concrete SCIM route handlers are not present here. The shared guard and shared module are present, but any EE-only controller decorators that apply `ScimAuthGuard` cannot be directly inspected in this directory.

## 2. Files to modify and why

- [server/src/modules/scim/guards/scim-auth.guard.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/scim/guards/scim-auth.guard.ts)
  Why: this is the vulnerable comparison/parsing logic. It needs strict header parsing, explicit rejection of empty/malformed credentials, and safe secret comparison.

- [server/src/modules/scim/module.ts](/home/jeff/tgl/pipe-e5e20590/server/src/modules/scim/module.ts)
  Why: the module currently provides SCIM services but not the auth guard or any startup validator. This is the shared cross-edition wiring point, so it is the correct place to register:
  `ScimAuthGuard`
  a new SCIM config validator provider that runs at startup

- New file under `server/src/modules/scim/`, preferably `services/scim-config-validation.service.ts`
  Why: SCIM should fail fast at startup when `SCIM_ENABLED=true` but the auth config is incomplete or empty. A dedicated `OnModuleInit` provider keeps that logic isolated, reusable, and easy to unit test.

- New test file `server/test/modules/scim/scim-auth.guard.spec.ts`
  Why: there is currently no SCIM-specific unit coverage in `server/test`. The guard is small enough to test in isolation with mocked `ConfigService` and a fake `ExecutionContext`.

- New test file `server/test/modules/scim/scim-config-validation.service.spec.ts`
  Why: startup validation has enough configuration combinations that it should be covered directly rather than only through manual boot tests.

- [docs/versioned_docs/version-3.16.0-LTS/user-management/sso/scim/overview.md](/home/jeff/tgl/pipe-e5e20590/docs/versioned_docs/version-3.16.0-LTS/user-management/sso/scim/overview.md)
  Why: the current docs explain the env vars but do not state the failure behavior or clarify that SCIM must have at least one complete auth mode. If raw header-token auth remains supported, the accepted header format should also be explicit.

- [.env.example](/home/jeff/tgl/pipe-e5e20590/.env.example)
  Why: the SCIM variables are not currently advertised there. If the implementation adds strict startup validation, discoverability of the required vars should improve at the same time.

- Optional docs alignment: [docs/openapi/scim/index.openapi.yaml](/home/jeff/tgl/pipe-e5e20590/docs/openapi/scim/index.openapi.yaml)
  Why: this file currently documents the routes but not the auth scheme. Update only if the implementation agent is already touching SCIM docs and wants generated API docs to match reality.

## 3. Implementation approach

- Add a dedicated SCIM config validator service.
  Suggested shape: `@Injectable() export class ScimConfigValidationService implements OnModuleInit`.
  It should read `SCIM_ENABLED`, `SCIM_BASIC_AUTH_USER`, `SCIM_BASIC_AUTH_PASS`, and `SCIM_HEADER_AUTH_TOKEN` from `ConfigService`.
  If `SCIM_ENABLED !== 'true'`, it should no-op.
  If `SCIM_ENABLED === 'true'`, it should enforce:
  at least one complete auth mode is configured
  Basic auth is only considered configured when both username and password are present and non-blank
  header-token auth is only considered configured when the token is present and non-blank
  partial Basic config is an error, not something to ignore silently
  blank-string secrets are treated as invalid
  Fail with a clear startup error before the server listens.

- Register the validator and the guard in `ScimModule.providers`.
  This keeps the fix in the shared SCIM module that is imported by `AppModule` in all editions.
  It also makes DI resolution explicit for any controller decorators that use `ScimAuthGuard`.

- Harden `ScimAuthGuard` parsing logic.
  Recommended flow:
  read `request.headers.authorization`
  reject missing, non-string, array, or blank headers immediately
  detect auth scheme explicitly instead of splitting blindly
  support Basic auth only for `Basic <base64>` inputs
  support bearer token auth only for `Bearer <token>` inputs with a non-empty token
  preserve the current raw-header token compatibility only if that behavior is still intended, meaning allow `Authorization: <token>` when it exactly matches the configured header token
  reject malformed headers instead of falling through into `undefined` comparisons

- Replace direct string equality with a safe comparison helper.
  Use `crypto.timingSafeEqual` behind a helper that first rejects missing inputs.
  Implementation detail is flexible:
  comparing UTF-8 buffers after a length check is acceptable
  comparing fixed-length digests of both strings before `timingSafeEqual` is also acceptable if the implementation agent prefers a helper that never throws on length mismatch
  The important requirement is that no auth path should compare raw secrets with plain `===`.

- Preserve backward-compatible auth behavior where the repo’s docs imply it is intentional.
  The current docs say SCIM supports both Basic Authentication and Header Token Authentication.
  The fix should therefore allow:
  Basic only
  header token only
  both configured at once
  What should not be allowed is:
  SCIM enabled with neither mode configured
  SCIM enabled with only one half of the Basic pair configured
  SCIM enabled with blank secrets

- Keep the scope focused on SCIM auth boundary correctness.
  No license behavior changes are required; SCIM’s license checks already happen through `AbilityGuard`.
  No route/controller behavior changes are required in this checkout unless the implementation agent has EE handlers available and finds that `ScimAuthGuard` is not actually attached everywhere it should be.

- If the implementation agent has access to the full EE repo, they should verify route wiring.
  In this checkout `server/ee/` is empty, so the actual SCIM route methods are unavailable.
  In a full repo, confirm that every SCIM endpoint under `/api/scim/v2` uses `ScimAuthGuard`.
  If any route bypasses it and relies only on `FeatureAbilityGuard`, that route is still effectively public because SCIM features are marked `isPublic`.

- Update docs/config templates after code behavior is settled.
  The docs should say `SCIM_ENABLED=true` requires at least one complete auth mode.
  If raw token auth remains supported, spell out the accepted `Authorization` header format.
  If the implementation decides to deprecate raw token auth and require `Bearer`, that is a behavior change and should be documented explicitly before merging.

## 4. Edge cases and error handling

- `SCIM_ENABLED` is false.
  Startup validator should no-op.
  Guard should still reject access if the route is reached without SCIM being enabled.

- `SCIM_ENABLED=true` and all SCIM auth vars are unset.
  Startup should fail before listen.

- `SCIM_ENABLED=true` and only `SCIM_BASIC_AUTH_USER` or only `SCIM_BASIC_AUTH_PASS` is set.
  Startup should fail as incomplete Basic configuration.

- `SCIM_ENABLED=true` and `SCIM_HEADER_AUTH_TOKEN` is set to an empty string or whitespace.
  Startup should fail or treat it as invalid and fail if no other auth mode is complete.

- `authorization` header is absent.
  Guard returns `401`.

- `authorization` header is an array or non-string.
  Guard should reject cleanly instead of calling string methods on it.

- `Authorization: Bearer`
  Must reject, regardless of SCIM token config.

- `Authorization: anything-without-a-space`
  Must only succeed if raw header-token auth is intentionally supported and the full header exactly matches the configured token.
  It must never succeed because the configured token is unset.

- `Authorization: Basic` or `Authorization: Basic ` with no credentials.
  Must reject.

- `Authorization: Basic <garbage>`
  Must reject if base64 decode or `username:password` parsing does not produce valid values.

- `Authorization: Bearer <wrong-token>`
  Must reject even if raw-token mode is also enabled.

- Both Basic and header-token auth are configured.
  Both auth modes should keep working unless the implementation intentionally removes one and updates docs accordingly.

- Secret comparison helper receives missing or differently sized values.
  It must return false, not throw.

- Error messages.
  They should be explicit enough for operator debugging at startup, but runtime auth failures should avoid echoing configured secret material or overly precise parsing details.

## 5. Test strategy

- Add isolated unit tests for `ScimAuthGuard`.
  Suggested cases:
  rejects when SCIM is disabled
  rejects when header is missing
  rejects malformed raw headers when token is unset
  rejects `Authorization: Bearer` with an empty bearer value
  accepts `Bearer <token>` when `SCIM_HEADER_AUTH_TOKEN` matches
  accepts raw `Authorization: <token>` only if that compatibility mode is intentionally preserved
  rejects wrong bearer/raw token
  accepts valid Basic auth when both Basic env vars are configured
  rejects Basic auth when credentials are wrong
  rejects Basic auth when config is incomplete
  rejects malformed Basic payloads
  accepts both auth styles when both are configured

- Add isolated unit tests for the startup validator service.
  Suggested cases:
  no-op when SCIM is disabled
  throws when SCIM is enabled and no auth mode is configured
  throws on partial Basic config
  throws on blank header token
  passes with complete Basic config
  passes with valid header-token config
  passes when both modes are configured

- Prefer unit tests over e2e tests in this checkout.
  The concrete SCIM route implementations are not present here because `server/ee/` is empty.
  Guard and startup-validator tests are still enough to cover the vulnerability and its regression surface.

- If the implementation agent has EE handlers available, add one integration smoke test as a bonus.
  Example shape:
  boot the server with `SCIM_ENABLED=true` and no SCIM secrets
  assert startup fails
  boot with a valid token
  hit one SCIM route and verify `401` for malformed auth, `200/expected route status` for valid auth

- Useful verification commands after implementation:
  `npm --prefix server test -- --runInBand server/test/modules/scim/scim-auth.guard.spec.ts server/test/modules/scim/scim-config-validation.service.spec.ts`
  `npm --prefix server lint`

## 6. Existing artifacts or prior work from this directory that you are reusing

- [REPORT.md](/home/jeff/tgl/pipe-e5e20590/REPORT.md)
  Reused for the final retained finding summary and affected-file identification.

- [TRIAGE.md](/home/jeff/tgl/pipe-e5e20590/TRIAGE.md)
  Reused for severity/status/fix-complexity framing and the original recommended remediation direction.

- [FINDINGS.json](/home/jeff/tgl/pipe-e5e20590/FINDINGS.json)
  Reused to confirm the issue mapping: `TJ-001` links directly to GitHub issue `#16217`.

- [FILED_ISSUES.txt](/home/jeff/tgl/pipe-e5e20590/FILED_ISSUES.txt)
  Reused to confirm that this finding was already filed upstream and to cross-check the exact issue URL.

- [VALIDATION.md](/home/jeff/tgl/pipe-e5e20590/VALIDATION.md)
  Reused for the precise reproduction logic and initial mitigation ideas.
  Adjustment from that artifact: its “require exactly one configured SCIM auth method” suggestion should be softened to “require at least one complete method” because the repo’s SCIM docs currently describe both modes as supported together.

- [RECON.md](/home/jeff/tgl/pipe-e5e20590/RECON.md)
  Reused for the broader auth-surface inventory and the note that SCIM secrets are compared with plain `===`.

- [SAST.md](/home/jeff/tgl/pipe-e5e20590/SAST.md)
  Reused for the concrete `undefined === undefined` bypass explanation and the note that timing-safe comparison is currently absent.

- `server/ee/` being empty is itself an important reused context point.
  It explains why this plan focuses on shared/base files and unit tests instead of route-level EE integration tests in this directory.
