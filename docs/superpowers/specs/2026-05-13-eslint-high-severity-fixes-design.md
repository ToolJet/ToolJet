# ESLint setup — HIGH severity fixes

**Date**: 2026-05-13
**Branch**: feature/ci-rehab
**Author**: brainstormed with Claude

## Background

Audit of ToolJet's ESLint setup (post eslint-9 flat-config migration in commit
`8d8d67b5ea`) identified three HIGH severity gaps that erode lint signal:

1. **Server flat config silently dropped rules** when `server/eslint.config.js`
   was authored (pre-session). Old `server/.eslintrc.js` had underscore-ignore
   patterns (`varsIgnorePattern: '^_'`, `destructuredArrayIgnorePattern: '^_'`,
   `caughtErrorsIgnorePattern: '^_'`) and `'no-unsafe-optional-chaining': 'off'`
   that didn't make it across. The legacy `.eslintrc.js` was dead weight after
   eslint 9 made flat config the default, so the loss was invisible.

2. **`reportUnusedDisableDirectives` not enabled** in server / marketplace /
   plugins flat configs. Dead `eslint-disable` comments accumulate; this
   session alone found 3 stale `ban-types` disables in shipped code.

3. **Real bugs blanket-disabled** during the migration. Two
   `undefined ?? x ?? y` patterns in `plugins/packages/nocodb/lib/index.ts`
   are genuine bugs caught by `no-constant-binary-expression`; the rule was
   turned off across plugins to preserve legacy parity. Bugs remain hidden.

## Goals

- Restore server lint semantics that existed pre-flat-config migration
- Stop accumulating dead `eslint-disable` directives
- Fix the two known constant-nullish bugs in nocodb plugin
- Re-enable `no-constant-binary-expression` in plugins

## Non-goals

- Re-enable other strict v8 rules (`no-unused-expressions`,
  `no-empty-object-type`, `no-require-imports`) — left for a follow-up
- Migrate CLI workspace to flat config — separate PR, deferred
- Drop `eslint-plugin-prettier` / upgrade to prettier 3 — separate PR
- Enable type-aware linting rules — separate PR
- Touch frontend's eslint config — `reportUnusedDisableDirectives: 'off'`
  there is intentional (see frontend config comment) and protects unmatched
  plugin-rule disables

## Design

### Section 1 — Re-port server rules

Edit `server/eslint.config.js`. Update the `@typescript-eslint/no-unused-vars`
rule and add `no-unsafe-optional-chaining`:

```js
'@typescript-eslint/no-unused-vars': ['error', {
  vars: 'all',
  args: 'none',
  varsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
}],
'no-unsafe-optional-chaining': 'off',
```

Skip these from the old eslintrc:

- `extends: 'plugin:cypress/recommended'` — server has zero cypress files in
  its lint scope (`server/{src,ee,test}/**/*.ts`); plugin existed only to
  cover a different lint target. Dead extend.
- `'@typescript-eslint/ban-types'` — rule removed in typescript-eslint v8.
  Already replaced by `no-unsafe-function-type` / `no-wrapper-object-types` /
  `no-empty-object-type` in the current flat config.

**Verification**: `npm --prefix server run lint` clean. No source edits needed
in `server/src/` or `server/ee/` because existing `_unused` / `(_e)` /
`[_first, x]` patterns already assume these ignore patterns are active.

### Section 2 — Pre-audit + enable `reportUnusedDisableDirectives: 'error'`

Three-phase rollout to avoid CI surprises:

**Phase A — Discovery**: add temporary
`linterOptions: { reportUnusedDisableDirectives: 'warn' }` to
`server/eslint.config.js`, `marketplace/eslint.config.cjs`,
`plugins/eslint.config.js`. Run each workspace lint and collect orphans:

```bash
cd server && npm run lint 2>&1 | grep -i "unused eslint-disable"
cd marketplace && npm run lint 2>&1 | grep -i "unused eslint-disable"
cd plugins && npm run lint 2>&1 | grep -i "unused eslint-disable"
```

**Phase B — Cleanup**: for each orphan:

- Stale rule (e.g., `ban-types` removed in v8) → delete the comment
- Rule not currently configured but plausibly desired → leave + add inline
  justification, OR explicitly configure rule in flat config
- Genuinely dead → delete

**Phase C — Flip to error**: change `'warn'` → `'error'` in all three configs.

**Scope guard**: server has 283 files with `eslint-disable` comments. If
Phase A surfaces more than 50 orphans, abort Phase B+C, file a follow-up
issue, ship Sections 1 + 3 only.

Frontend's `eslint.config.mjs` is not touched. Its existing
`reportUnusedDisableDirectives: 'off'` is deliberate (see in-file comment).

### Section 3 — nocodb fix + re-enable rule

Edit `plugins/packages/nocodb/lib/index.ts`:

```js
// Before (lines 74, 89):
const response_value = response?.body ?? undefined ?? '';

// After:
const response_value = response?.body ?? '';
```

`undefined ?? '' ` is always `''` — the middle term is dead. Likely
copy-paste residue. Author intent preserved: fall back to empty string when
`response?.body` is nullish.

Edit `plugins/eslint.config.js` — remove this line:

```js
'no-constant-binary-expression': 'off',
```

**Verification**: `npm --prefix plugins run lint` clean.

## Sequencing

Single PR, three logical commits for clean blame:

1. `fix(server): re-port underscore-ignore patterns + no-unsafe-optional-chaining`
   — server/eslint.config.js only. Verify server lint.

2. `fix(plugins): nocodb constant-nullish bugs + re-enable rule`
   — nocodb/lib/index.ts + plugins/eslint.config.js. Verify plugins lint.

3. `chore: enable reportUnusedDisableDirectives across flat configs`
   — three eslint.config.* files + any orphan-disable cleanups from
   pre-audit. Verify all three workspace lints + pre-commit dry-run.

## Verification

After each commit:

- `npm --prefix <ws> run lint` exits 0 for the workspace touched

After commit 3:

- All three workspace lint commands exit 0
- Pre-commit dry-run: stage a representative `.ts` file from server,
  marketplace, plugins; run `npx lint-staged`; observe no errors

## Rollback

Each commit independently revertible. Worst case Phase A of Section 2
surfaces an unmanageable orphan count — abort Section 2 commits, ship
1 + 3-modified (skip the flag enable). No submodule changes; revert is
local to root repo.

## Open questions

None. All scope decisions resolved in brainstorm:

- Strict-rules re-enable scope: only `no-constant-binary-expression`
- `reportUnusedDisableDirectives` severity: `'error'`
- Sequencing: pre-audit + single PR (approach B)
