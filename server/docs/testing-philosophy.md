# Testing Philosophy (Backend)

> Judgment layer on top of the testing conventions in `server/AGENTS.md`. That section is
> mechanics — layout, TX isolation, naming, `@group`. This file is what to test, where it
> belongs, and what's safe to skip. Read both; don't duplicate either.
> Process discipline (red-green-refactor, watch-it-fail) is enforced by the
> `superpowers:test-driven-development` skill where available — this doc governs what/where,
> not the cycle.

## Principle: tests verify behavior, not implementation

A test should survive a rewrite of the function it covers and fail only when the *observable
behavior* changes. If it breaks on refactor with no behavior change, it's coupled to
implementation, not testing it.

## The behavior matrix — what "a path" means here

Line/branch coverage measures code executed, not decisions that matter. In ToolJet a "path" is a
point in this space:

| Axis | Values | Example |
|---|---|---|
| Edition | CE / EE / Cloud | audit logs: EE+ only |
| Plan | enterprise / team / starter | personal workspace: disabled on `team` |
| Role + granular permission | admin / builder / end-user / custom group | `CREATE_GRANULAR_FOLDER_PERMISSIONS` |
| Module/feature gate | `@InitModule`, `@InitFeature` | licensed but module-disabled ≠ unlicensed — distinct rejection paths |
| Tenant scope | own workspace vs. another workspace | cross-tenant read must be denied, not just filtered client-side |
| Resource state | draft/released, archived, soft-deleted | an archived app's endpoints may 404 where a live app's would 403 |

### Pruning rule — don't cross-product everything

Most axes **short-circuit**: license/plan gate rejects before role is ever evaluated. Test
short-circuiting axes **independently, once each**:
- the gate itself, at one representative role (denied + allowed)
- the full role matrix, once, at the plan that passes the gate

Only cross-product axes that **interact** — where the combination produces a *different* outcome
than either axis alone predicts. Example: `team` plan disabling personal workspaces changes what
`admin` vs `end-user` can even reach, so plan × role interacts there and earns a small combined
table. Everywhere else, testing plan-gate and role-matrix separately covers the space without the
combinatorial blowup.

Worked mini-matrix for a hypothetical gated, workspace-scoped endpoint:
- CE → 403 (gate, tested once)
- EE/enterprise, wrong workspace → 404/403 (tenant scope, tested once)
- EE/enterprise, admin → 200 (role, allowed)
- EE/enterprise, end-user without permission → 403 (role, denied)
- EE/enterprise, resource archived → whatever the spec says (resource state, only if it differs
  from the live-resource case)

Five cases, not the 3×2×4×2 = 48 a naive cross-product would suggest.

## Unit vs e2e — the decision rule

- **Behavior-location rule**: internal branching/filtering/transform logic a service/guard/util
  owns → unit, isolated, no DB/HTTP.
- **Pipeline-only meaning** → e2e only, not duplicated at unit level: anything that only means
  something through HTTP → guard → DB → response.
- **Guard/ability unit** — the third bucket, easy to miss if you think in a strict binary: a real
  CASL ability factory exercised directly, no HTTP, no DB.
  `test/modules/group-permissions/unit/feature-ability.spec.ts`,
  `test/modules/app/unit/app-auth.guard.spec.ts`.

## What MUST be covered

- Every branch/conditional a service owns
- Every error path (4xx/5xx) at the e2e layer
- CASL/permission boundary conditions (allowed / denied / edge role)
- Edition & plan variance where behavior actually differs (cross-ref the edition/plan table in
  `server/AGENTS.md` — don't duplicate the table itself)
- Module/feature-gate denial distinct from license denial — a module disabled by config and a
  feature unlicensed by plan are different rejection paths; don't let one test stand in for both
- **Cross-tenant isolation** — every list/read endpoint gets a "resource belonging to another
  workspace is not visible or reachable" case. Currently the least-covered MUST-item in this
  codebase and the one line coverage will never surface, since the missing check and the present
  one execute the same lines either way.
- Data mutation correctness (row ends up in the expected state)

## What NOT to test

- Framework/library guarantees (TypeORM decorators, NestJS DI wiring)
- Getters/setters, DTOs with no custom validation logic
- Trivial pass-throughs (no branching, no transformation)
- The same condition re-asserted at both unit and e2e layers
- Log output / console messages as assertions
- Migrations re-run as tests (that's what `db:migrate` in CI is for)
- Empty CE/plan gating blocks for features with no actual divergence (see "only add sections when
  behavior actually differs" in `server/AGENTS.md`)
- Heuristic: "what could actually break here?" — if nothing, skip it

## Test doubles — the boundary rule

Mock only boundaries you don't own: external HTTP (Polly.js HAR, see `test/__fixtures__/`), SMTP,
S3, git remotes, the license server. Never mock your own repositories in e2e — that's testing the
mock, not the pipeline. In unit tests, prefer null-injecting real collaborators over
`jest.mock`-ing the module graph — see the constructor pattern in
`test/modules/folder-apps/unit/service.spec.ts` (`super(null as unknown as X, ...)` against a
subclass that exposes the protected method under test; cast through `unknown`, never `any`).

## When to delete a test

Addition criteria alone produce accretion, not quality. Two removal signals:
- **Mutation heuristic**: break the implementation on purpose. If the test still passes, it isn't
  testing anything — delete or fix it.
- **Cross-layer duplicate**: if a unit test already pins a condition, the e2e test for the same
  condition should assert the pipeline reaches that code, not re-assert the condition's outcome.
  One of the two is redundant; keep the cheaper one.

## Determinism

- No wall-clock dependence (no `sleep`-and-hope, no real timers where fake timers work)
- No inter-test ordering dependence — each `it()` must pass if run alone or shuffled
- No shared mutable state across spec files — suite-TX + SAVEPOINTs already isolate DB state; don't
  reintroduce coupling through module-level variables

## Coverage: qualitative, not numeric

No % target — coverage tooling (`test/jest-coverage.config.ts`, v8 provider) is a regression
tripwire, not a scoreboard. Practical use:
- Read it as a diff signal on **changed files**: did this PR add a branch with no test touching it?
- The exclusion list (`*.module.ts`, `*.entity.ts`, `*.dto.ts`, `main.ts`, migration helpers) is
  intentional — uncovered lines there are not gaps.
- v8's branch accounting differs from babel's; don't chase a branch-% number, use it to spot a
  specific untested `if`.

## TDD note

Acceptance criteria (or, for a bugfix, the bug report) define WHAT to test — write the failing
test first. For e2e-only behavior, "red" means the request against the real pipeline returns the
wrong status/shape, not a compile error. A bugfix's first commit is a test that reproduces the
report and fails against pre-fix code.

## Anti-patterns

- Over-mocking to the point the mock IS the implementation
- Snapshotting large objects instead of asserting the shape that matters
- One `it()` covering five behaviors — can't tell what broke
- Re-testing a guard's CASL logic through every controller that uses it — test the guard once;
  controllers assert "guard is applied"

## Worked examples

- **Pure branching logic → unit, no DB**:
  `test/modules/folder-apps/unit/service.spec.ts` —
  `FolderAppsService.filterFoldersByPermissions` exercised via a subclass that exposes the
  protected method, collaborators null-injected.
- **Authorization decision → guard unit, real factory, no HTTP**:
  `test/modules/group-permissions/unit/feature-ability.spec.ts`.
- **Gated + workspace-scoped endpoint → e2e only**:
  `test/modules/folder-apps/e2e/folder-apps.spec.ts` — meaning only exists through
  HTTP → guard → DB → response; not duplicated at unit level.

## Decision checklist (before writing a test)

1. What could actually break here?
2. Does it need a real DB/HTTP round trip to be meaningful? → e2e. Else → unit.
3. Already covered by a lower-level unit test? → don't re-assert at e2e.
4. Trivial / framework-guaranteed? → skip.
5. Which matrix cells (edition, plan, role, module/feature gate, tenant scope, resource state)
   does this cover — and which are being deliberately skipped because they short-circuit or
   don't interact?
