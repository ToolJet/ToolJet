# Review lenses

Each lens names the repo file that owns the rule. Cite that file in the comment ("per
`server/docs/testing.md`, ...") rather than restating the rule, so the author can read the
source and the comment stays short. Where a lens has no repo file, the rule is stated here.

Apply every lens to every section. Most lenses find nothing in most sections, which is the
"checked and clean" list in the section file.

## Correctness

Authority: the section's own contract (its tests, the PR description, the intake note's
supplied context), plus `.agents/context/architecture-map.md` "End-to-end flows" and "Expected
failure modes" when the change crosses a boundary.

Ask, for every changed path:

- Does it hold for every tenant (workspace), every environment, and every edition? CE, EE and
  Cloud run the same code with runtime gates (`getTooljetEdition()`, `fetchEdition()`); a change
  that only works when the EE service overrides the CE one is a CE bug.
- What happens on the failure path: rollback, partial write, retry, stale cache?
- Concurrency: two builders, two requests, a queue worker and a request at once.
- Migrations: reversible, safe on a populated table, and matched by an entity change.

Phrase as the consequence for a user or an operator, then the trace that gets there.

## Tests

Authority: `server/docs/testing.md`. Sections that matter most in review:

- "When to delete a test": the mutation heuristic. For each new test, break the implementation
  it claims to cover. If the suite stays green, the test asserts nothing. Report the exact
  mutation in the comment so the author can reproduce it. In practice the branch that a file's
  longest comment describes is the branch nothing tests.
- "Assertions": response shape via `toMatchObject()`, never per-field `toBe` chains. A changed
  response shape with no updated shape assertion is unverified.
- "The behavior matrix" and "Pruning rule": is the set of cases the right set, not the biggest set.
- "Test doubles: the boundary rule": mocks only at the boundary. A mocked repository under a
  service test proves nothing about the query.
- "Edition and plan": CE tests verify gating, EE tests verify behavior.

Frontend: `frontend/AGENTS.md` "Testing context" for what is and is not covered by Cypress.

Specs are a place for concretion, not abstraction. A reader must understand the contract without
opening a helper. Suggest rewording where the spec hides the detail that makes it pass.

## Typing

Authority: `server/AGENTS.md` "Design principles". No `any`; precise types, or a cast through
`unknown` where unavoidable. An `any` on an entity field forces a cast at every downstream
reader, so name the reader in the comment. Response and request shapes belong in DTOs, see the
API contract lens.

## Comments

No repo file; rule as the user applies it. Default to no comment. When the WHY is not obvious,
one short line, fragments allowed, no articles, no hedging. Findings:

- Narration of what the code does. The diff already says it.
- History or agent narration: "previously this...", "we tried X and...", rejected alternatives.
- Cross-file reasoning that belongs in the module's `AGENTS.md` instead.
- Private paths, customer names, or internal ticket links in public code.
- Multi-line blocks that collapse to one line or to nothing.

Suggest the one-line replacement in a `suggestion` block, or deletion.

## Design

Authority: `server/AGENTS.md` "Design principles" (A Philosophy of Software Design and Grokking
Simplicity, pragmatically). Look for:

- Calculations tangled with I/O. Pure logic that could be a module-level function above the
  class, tested without a database.
- Shallow pass-through layers: a service method that only forwards to a repository method.
- Complexity pushed to callers: every caller re-deriving the same field list, the same guard.
- General-purpose and special-purpose code in one function.

Practical refactors only, with the shape shown. Never speculative ("this might need...").

## Conventions

Authority: the closest `AGENTS.md` to the changed file, then `server/AGENTS.md` or
`frontend/AGENTS.md`, then root `AGENTS.md`. Specific checks:

- Living-docs rule (root `AGENTS.md` "Context file layout", `server/AGENTS.md` "Module context
  files"): a new service, changed invariant, renamed concept, or new gotcha with no `AGENTS.md`
  update in the same PR is a finding. A module with no `AGENTS.md` yet gets one from
  `server/docs/agents-module-template.md`.
- Glossary (`UBIQUITOUS_LANGUAGE.md`, `server/AGENTS.md` "Language"): Workspace not Organization
  in user-facing text, Component not Widget, never `ds` for `data_source`. New domain terms
  update the glossary in the same PR.
- Edition split (root `AGENTS.md` "Editions & submodules"): CE code never imports `@ee/` or
  `@cloud/`; EE services extend CE and call `super()`; edition-gated CE stubs return 501 or 403.
- Frontend (`frontend/AGENTS.md` "Review gotchas"): hardcoded colors, missing `tw-` prefix, new
  `react-bootstrap` imports, class components, debug leftovers, missing `key`, missing `shallow`
  in `useStore` selectors, direct DOM manipulation.
- Widget config sync (`server/AGENTS.md` "Widget config sync", `frontend/AGENTS.md` "Widget
  config"): a widget config change without the server-side sync is a finding.
- Maps (`.agents/context/product-map.md`, `.agents/context/architecture-map.md`): a new public
  capability, role, integration, or data store with no map update.

## API contract

Authority: `.agents/skills/api-design/SKILL.md`. Apply only when the PR touches
`server/src/modules/**/controller*.ts`, a `dto/` directory, or `server/src/modules/external-apis/`
(or their `server/ee/` equivalents). Its checklist is the finding list: raw entity in a response,
anonymous inline object, `decamelizeKeys` on output, untyped `@Query()` or `@Body()`, duplicated
DTO, missing `ClassSerializerInterceptor`, missing `toMatchObject` shape test, dropped field with
no consumer grep across `frontend/src` and `frontend/ee`. Anything under `external-apis/` is the
public contract and a removed field needs a deprecation path.

## Security

Authority: `server/AGENTS.md` "Security" (parameterized queries only), `frontend/AGENTS.md`
"Security" (no secrets client-side, `resolveCode` evaluates what reaches it), root `AGENTS.md`
"Public/private boundary". Also check:

- Authorization: every new controller route carries the guard and CASL ability the sibling
  routes carry (`server/AGENTS.md` "Authorization (CASL)"). A route that resolves a resource by
  id without a workspace scope is an IDOR.
- Secrets and tokens in logs, error messages, fixtures, or the PR description.
- Private paths or private source quoted in public files or public comments.

Security findings are Blocker by default. State the exploit path in the comment, not a generic
warning.

## Severity

Every finding in the report carries one. It orders the report, sets the opening line on the
large tier, and decides what goes up if the user later asks to post. Closed set:

| Severity | Meaning |
|---|---|
| Blocker | Wrong result, data loss, security hole, or a broken contract for some tenant, environment, or edition. Must be fixed before merge. |
| High | Correct today but a change the next reader or next PR will break, or a test that proves nothing about a critical path. |
| Medium | Convention, design, or living-docs gap with a clear fix. |
| Nit | Wording, naming, one-line comment trims. |
| Question | Cannot tell from the diff and the intake note whether it is intended. |

Small and medium tiers report everything worth a thread and skip the tag in the comment body.
Large tier keeps Blocker and High in the section files and moves the rest to `handoff.md`; if
posting is requested, only those two severities go up.
