# Review lenses

Each lens names the repo file that owns the rule. Cite it in the comment ("per
`server/docs/testing.md`, ...") instead of restating the rule. Lenses with no repo file state the
rule here.

Apply every lens to every section. A lens that finds nothing goes in the section's "checked and
clean" list.

## Correctness

Authority: the section's own contract (its tests, the PR description, the intake note's supplied
context), plus `.agents/context/architecture-map.md` "End-to-end flows" and "Expected failure
modes" when the change crosses a boundary.

For every changed path:

- Does it hold for every tenant (workspace), environment, and edition? CE, EE and Cloud run the
  same code with runtime gates (`getTooljetEdition()`, `fetchEdition()`); a change that only works
  when the EE service overrides the CE one is a CE bug.
- Failure path: rollback, partial write, retry, stale cache?
- Concurrency: two builders, two requests, a queue worker and a request at once.
- Migrations: reversible, safe on a populated table, matched by an entity change.

Phrase as the consequence for a user or operator, then the trace that gets there.

## Tests

Authority: `server/docs/testing.md`, especially:

- "When to delete a test" (mutation heuristic): for each new test, break the implementation it
  claims to cover; if the suite stays green, the test asserts nothing. Put the exact mutation in
  the comment so the author can reproduce it. The branch a file's longest comment describes is
  usually the one nothing tests.
- "Assertions": response shape via `toMatchObject()`, never per-field `toBe` chains. A changed
  response shape with no updated shape assertion is unverified.
- "The behavior matrix" and "Pruning rule": the right set of cases, not the biggest.
- "Test doubles: the boundary rule": mocks only at the boundary. A mocked repository under a
  service test proves nothing about the query.
- "Edition and plan": CE tests verify gating, EE tests verify behavior.

Frontend: `frontend/AGENTS.md` → Testing, and the guide it names (`src/test/README.md`), for Jest
conventions and what belongs in Cypress.

Specs are for concretion, not abstraction: the contract must be readable without opening a helper.
Suggest rewording where the spec hides the detail that makes it pass.

## Typing

Authority: `server/AGENTS.md` "Design principles". No `any`; precise types, or a cast through
`unknown` where unavoidable. An `any` on an entity field forces a cast at every downstream reader,
so name the reader. Response and request shapes belong in DTOs (API contract lens).

## Comments

No repo file; rule as the user applies it. Default to no comment. Deletion beats relocation.

The sweep is exhaustive: list every comment block the diff adds or changes, in code, tests and
submodules, with a verdict each: DELETE, KEEP, or AGENTS.md. A partial pass feels complete and is
not; unflagged blocks go in "checked and clean" so the author sees the sweep was done.

- DELETE (default): narration of what the code does; history ("previously", "the first draft had",
  "was here and is gone"); measurements and anecdotes; rejected alternatives; reviewer narration
  ("the reviewer's point"); restating a test name, function name, or the diff; cross-file pointers
  the reader gets by following the symbol; private paths, customer names, internal ticket links.
- KEEP: one line, fragments allowed, no articles, no hedging, only when the WHY is not deducible
  from the code, the symbol it names, or the test name: a trap, an external constraint, a removal
  condition. Argue against every keep before writing it.
- AGENTS.md: only when not deducible from the code AND a general rule of the module. Phrase it as
  the rule sentence for the doc. If it can only be told as a story about one line, it is DELETE.

Finding shape: empty `suggestion` block for DELETE; the one-line replacement in a `suggestion`
block for KEEP; the rule sentence plus a living-docs finding for AGENTS.md. A block inside another
finding's anchor folds its verdict into that finding's suggestion, not an overlapping thread.

## Design

Authority: `server/AGENTS.md` "Design principles" (A Philosophy of Software Design and Grokking
Simplicity, pragmatically). Look for:

- Calculations tangled with I/O: pure logic that could be a module-level function above the class,
  tested without a database.
- Shallow pass-through layers: a service method that only forwards to a repository method.
- Complexity pushed to callers: every caller re-deriving the same field list or guard.
- General-purpose and special-purpose code in one function.

Practical refactors only, with the shape shown. Never speculative ("this might need...").

## Conventions

Authority: the closest `AGENTS.md` to the changed file, then `server/AGENTS.md` or
`frontend/AGENTS.md`, then root `AGENTS.md`. Checks:

- Living-docs rule (root `AGENTS.md` "Context file layout", `server/AGENTS.md` "Module context
  files"): a new service, changed invariant, renamed concept, or new gotcha with no `AGENTS.md`
  update in the same PR. A module with no `AGENTS.md` gets one from
  `server/docs/agents-module-template.md`.
- Glossary (`UBIQUITOUS_LANGUAGE.md`, `server/AGENTS.md` "Language"): Workspace not Organization in
  user-facing text, Component not Widget, never `ds` for `data_source`. New domain terms update the
  glossary in the same PR.
- Edition split (root `AGENTS.md` "Editions & submodules"): CE code never imports `@ee/` or
  `@cloud/`; EE services extend CE and call `super()`; edition-gated CE stubs return 501 or 403.
- Frontend (`frontend/AGENTS.md` "Review gotchas"): hardcoded colors, missing `tw-` prefix, new
  `react-bootstrap` imports, class components, debug leftovers, missing `key`, missing `shallow` in
  `useStore` selectors, direct DOM manipulation.
- Widget config sync (`server/AGENTS.md` "Widget config sync", `frontend/AGENTS.md` "Widget
  config"): a widget config change without the server-side sync.
- Maps (`.agents/context/product-map.md`, `.agents/context/architecture-map.md`): a new public
  capability, role, integration, or data store with no map update.

## API contract

Authority: `.agents/skills/api-design/SKILL.md`. Only when the PR touches
`server/src/modules/**/controller*.ts`, a `dto/` directory, or `server/src/modules/external-apis/`
(or their `server/ee/` equivalents). Its checklist is the finding list: raw entity in a response,
anonymous inline object, `decamelizeKeys` on output, untyped `@Query()` or `@Body()`, duplicated
DTO, missing `ClassSerializerInterceptor`, missing `toMatchObject` shape test, dropped field with no
consumer grep across `frontend/src` and `frontend/ee`. Anything under `external-apis/` is the public
contract; a removed field needs a deprecation path.

## Merge impact and evidence

- **Honest reversible verdict.** A PR that drops or rewrites data, changes a public API or
  contract, or triggers a release or other external side effect is not reversible, whatever its
  description says. A "🟢 reversible" on such a change, or a folded block on an irreversible one,
  is a finding.
- **Stated Reach vs the diff:** editions, tenants, modules, contract consumers, existing saved apps.
- **Irreversible PR with no Rollback plan or no Evidence section** (before → after proof) is a
  finding.
- **Runtime change whose only evidence is "it should work"** is unverified. Ask for the test run or
  screenshot.

## Security

Authority: `server/AGENTS.md` "Security" (parameterized queries only), `frontend/AGENTS.md`
"Security" (no secrets client-side, `resolveCode` evaluates what reaches it), root `AGENTS.md`
"Public/private boundary". Also check:

- Authorization: every new controller route carries the guard and CASL ability its sibling routes
  carry (`server/AGENTS.md` "Authorization (CASL)"). A route resolving a resource by id without a
  workspace scope is an IDOR.
- Secrets and tokens in logs, error messages, fixtures, or the PR description.
- Private paths or private source quoted in public files or public comments.

Security findings are Blocker by default. State the exploit path, not a generic warning.

## Severity

Every finding carries one. It orders the report, sets line 1 on the large tier, and decides what
goes up if the user later asks to post. Closed set:

| Severity | Meaning |
|---|---|
| Blocker | Wrong result, data loss, security hole, or a broken contract for some tenant, environment, or edition. Must be fixed before merge. |
| High | Correct today but a change the next reader or next PR will break, or a test that proves nothing about a critical path. |
| Medium | Convention, design, or living-docs gap with a clear fix. |
| Nit | Wording, naming, one-line comment trims. |
| Question | Cannot tell from the diff and the intake note whether it is intended. |

Small and medium tiers report everything worth a thread and omit the tag in the comment body.
Large tier keeps Blocker and High in the section files and moves the rest to `handoff.md`; if
posting is requested, only those two go up.
