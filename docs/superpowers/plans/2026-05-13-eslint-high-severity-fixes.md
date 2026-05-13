# ESLint HIGH-Severity Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore server lint semantics lost in the flat-config migration, fix two real bugs hidden by a blanket-disabled rule, and stop dead `eslint-disable` comments from accumulating.

**Architecture:** Three logical commits inside one PR on `feature/ci-rehab`. Verification is `npm --prefix <ws> run lint` exit-zero per workspace, plus a pre-commit dry-run at the end. No production code logic changes outside `plugins/packages/nocodb/lib/index.ts`. No submodule changes.

**Tech Stack:** ESLint 9 flat config (`server/eslint.config.js`, `marketplace/eslint.config.cjs`, `plugins/eslint.config.js`), `@typescript-eslint` v8, husky pre-commit hook, lint-staged.

**Spec:** `docs/superpowers/specs/2026-05-13-eslint-high-severity-fixes-design.md`

---

## File Structure

Files touched in this plan:

- **`server/eslint.config.js`** — restore underscore-ignore patterns in `no-unused-vars`; later add `linterOptions.reportUnusedDisableDirectives: 'error'`.
- **`plugins/eslint.config.js`** — remove `'no-constant-binary-expression': 'off'`; later add `linterOptions.reportUnusedDisableDirectives: 'error'`.
- **`marketplace/eslint.config.cjs`** — later add `linterOptions.reportUnusedDisableDirectives: 'error'`.
- **`plugins/packages/nocodb/lib/index.ts`** — fix two `undefined ?? x` constant-nullish bugs (lines 74 and 89).
- **Cleanup files (TBD by Task 3 Phase A)** — any source file with an orphan `eslint-disable` comment surfaced during pre-audit. Path list will be the output of the discovery commands.

Files **not** touched: `frontend/eslint.config.mjs`, `cli/.eslintrc.js`, root `eslint.config.mjs`, root `package.json` (lint-staged config), any submodule.

---

## Task 1: Re-port server underscore-ignore patterns

**Files:**
- Modify: `server/eslint.config.js` (rules block, the `@typescript-eslint/no-unused-vars` entry)

**Context:** The legacy `server/.eslintrc.js` (deleted in commit `8d8d67b5ea`) had `varsIgnorePattern: '^_'`, `destructuredArrayIgnorePattern: '^_'`, and `caughtErrorsIgnorePattern: '^_'` on the `no-unused-vars` rule. The current flat config kept the rule but dropped those options. Server source code already uses these patterns (e.g., `(_e)` catch params, `_unused` destructure renames). Note: `'no-unsafe-optional-chaining': 'off'` from the old config IS already present (line 75 of current config) — no need to re-add.

- [ ] **Step 1: Verify current state — confirm server lint passes before edit**

Run: `cd server && npm run lint`
Expected: exits 0, no output beyond the `> server@0.0.1 lint` / `> eslint . '**/*.ts'` headers.

- [ ] **Step 2: Edit `server/eslint.config.js` `no-unused-vars` rule**

Replace lines 67-70:

```js
    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "none",
    }],
```

with:

```js
    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "none",
      varsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    }],
```

- [ ] **Step 3: Verify server lint still passes**

Run: `cd server && npm run lint`
Expected: exits 0. The restored ignore patterns are strictly more permissive than what was running — should never cause new errors.

- [ ] **Step 4: Verify the `_input_tokens` workaround in `server/ee/ai/util.service.ts` is now unnecessary, then remove it**

Open `server/ee/ai/util.service.ts` around line 452-454. Current code:

```ts
    const data = (await response.json()) as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { input_tokens, output_tokens, model, ...rest } = data;
    return rest;
```

Three approaches — pick one:

**Option A (preferred): rename with underscores to satisfy `varsIgnorePattern: '^_'`**

Replace with:

```ts
    const data = (await response.json()) as Record<string, unknown>;
    const { input_tokens: _input_tokens, output_tokens: _output_tokens, model: _model, ...rest } = data;
    return rest;
```

**Option B: leave the eslint-disable in place** — works but introduces an orphan disable that Task 3 will then flag and require deletion (extra churn).

**Option C: use rest-only spread** — `const { ...rest } = data;` followed by `delete rest.input_tokens` etc. — diverges from established style; skip.

Use Option A.

- [ ] **Step 5: Re-run server lint**

Run: `cd server && npm run lint`
Expected: exits 0. The eslint-disable comment is gone and the underscore-prefixed names are accepted by the restored `varsIgnorePattern`.

- [ ] **Step 6: Stage the server changes**

This task's edits are in the server/ee submodule (`util.service.ts`) AND the root repo (`server/eslint.config.js`). The submodule needs its own commit before the root.

In the server/ee submodule:

```bash
git -C server/ee add ai/util.service.ts
git -C server/ee commit -m "fix: drop eslint-disable now that varsIgnorePattern restored"
git -C server/ee push origin feature/ci-rehab
```

Then in the root repo:

```bash
git add server/eslint.config.js server/ee
git commit -m "fix(server): re-port underscore-ignore patterns on no-unused-vars

The flat-config migration dropped varsIgnorePattern, destructuredArrayIgnorePattern,
and caughtErrorsIgnorePattern from the no-unused-vars rule. Server source code
already uses these patterns (e.g., _unused destructure renames, (_e) catch params)
assuming they're ignored. Restoring matches the pre-flat-config legacy behavior.

Also remove a workaround eslint-disable in server/ee/ai/util.service.ts that
was added during the migration window when the pattern wasn't ignored."
```

---

## Task 2: Fix nocodb constant-nullish bugs + re-enable `no-constant-binary-expression`

**Files:**
- Modify: `plugins/packages/nocodb/lib/index.ts` (lines 74 and 89)
- Modify: `plugins/eslint.config.js` (remove `'no-constant-binary-expression': 'off'`)

**Context:** The plugins flat config disables `no-constant-binary-expression` to preserve legacy parity. Two real bugs hide behind that: `Number(queryOptions.record_id) ?? 0` patterns. `Number()` never returns null/undefined (returns `NaN` for invalid input), so the left side of `??` is constant non-nullish — the `?? 0` fallback is dead. The fix swaps `??` for `||` to actually catch `NaN`, which is falsy. The two sites are inside the `update_record` and `delete_record` cases of the switch.

- [ ] **Step 1: Inspect the exact current code at the two sites**

Run: `sed -n '70,95p' plugins/packages/nocodb/lib/index.ts`
Expected: see two assignments matching `const record_id = Number(queryOptions.record_id) ?? 0;` at lines 74 (inside `case 'update_record'`) and 89 (inside `case 'delete_record'`).

If the surrounding context differs, STOP and report — do not blindly apply the edit.

- [ ] **Step 2: Edit line 74**

Locate the line inside the `case 'update_record': {` block. Replace:

```ts
const record_id = Number(queryOptions.record_id) ?? 0;
```

with:

```ts
const record_id = Number(queryOptions.record_id) || 0;
```

(Use Edit tool with surrounding context — the `case 'update_record': {` line above — so the match is unique; both lines 74 and 89 have the same content.)

- [ ] **Step 3: Edit line 89**

Same `?? 0` → `|| 0` swap at line 89, using the `case 'delete_record': {` block above as disambiguating context.

- [ ] **Step 4: Verify plugins lint still passes (rule still disabled)**

Run: `cd plugins && npm run lint`
Expected: exits 0. Bug fix is a no-op semantically; lint result unchanged.

- [ ] **Step 5: Re-enable the rule in `plugins/eslint.config.js`**

Find the line:

```js
      'no-constant-binary-expression': 'off',
```

Delete that entire line.

- [ ] **Step 6: Verify plugins lint still passes (rule now active, bugs fixed)**

Run: `cd plugins && npm run lint`
Expected: exits 0. If lint fails with `no-constant-binary-expression` on a file other than `nocodb/lib/index.ts`, STOP — there's a third site the audit missed. Report and re-scope.

- [ ] **Step 7: Stage and commit**

```bash
git add plugins/packages/nocodb/lib/index.ts plugins/eslint.config.js
git commit -m "fix(plugins/nocodb): use || for NaN fallback + re-enable no-constant-binary-expression

\`Number(x) ?? 0\` is a constant-binary-expression bug — \`Number()\` never returns
null/undefined, so \`?? 0\` is dead. Switching to \`||\` covers the NaN case the
fallback was clearly intended for. Two occurrences in nocodb/lib/index.ts
(update_record and delete_record cases).

The no-constant-binary-expression rule had been disabled in plugins/eslint.config.js
to preserve legacy parity during the eslint 7→9 migration; re-enabled with the
bugs fixed."
```

---

## Task 3: Enable `reportUnusedDisableDirectives` (pre-audit → cleanup → flip)

**Files:**
- Modify: `server/eslint.config.js` (add `linterOptions`)
- Modify: `marketplace/eslint.config.cjs` (add `linterOptions`)
- Modify: `plugins/eslint.config.js` (add `linterOptions`)
- Modify: any source file surfaced by the pre-audit (TBD — list comes from Phase A output)

**Context:** Three-phase to avoid CI surprises. Phase A enumerates orphan disable comments. Phase B cleans them up. Phase C flips the flag to `'error'` so future orphans block.

### Phase A — Discovery

- [ ] **Step 1: Add `linterOptions.reportUnusedDisableDirectives: 'warn'` temporarily to all three configs**

In `server/eslint.config.js`, insert immediately after the `module.exports = defineConfig([{` line (line 23) and before `files: ["**/*.ts"],`:

```js
  linterOptions: {
    reportUnusedDisableDirectives: "warn",
  },
```

In `marketplace/eslint.config.cjs`, locate the second array element (the one with `files: ['**/*.ts']`). Insert at the top of that object:

```js
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
```

In `plugins/eslint.config.js`, same pattern — top of the `files: ['**/*.ts']` object:

```js
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
```

- [ ] **Step 2: Run each workspace lint and capture orphan-disable warnings**

```bash
cd server && npm run lint 2>&1 | grep -i "unused eslint-disable" > /tmp/server-orphans.txt
wc -l /tmp/server-orphans.txt
cd marketplace && npm run lint 2>&1 | grep -i "unused eslint-disable" > /tmp/marketplace-orphans.txt
wc -l /tmp/marketplace-orphans.txt
cd plugins && npm run lint 2>&1 | grep -i "unused eslint-disable" > /tmp/plugins-orphans.txt
wc -l /tmp/plugins-orphans.txt
```

Expected: three line counts. Sum them.

- [ ] **Step 3: Scope guard**

If total orphan count > 50, STOP. The spec explicitly says to abort this task at that threshold and ship only Task 1 + Task 2. To abort: revert the three `linterOptions` insertions (`git checkout -- server/eslint.config.js marketplace/eslint.config.cjs plugins/eslint.config.js`) and report the orphan count + a sample of findings to the user. Wait for instruction.

If total <= 50, continue.

### Phase B — Cleanup

- [ ] **Step 4: Categorize each orphan**

For each line in `/tmp/server-orphans.txt`, `/tmp/marketplace-orphans.txt`, `/tmp/plugins-orphans.txt`, open the referenced file and decide:

- **Stale rule** (rule name no longer configured, e.g., `@typescript-eslint/ban-types` removed in v8) → delete the disable comment.
- **Currently-passing rule** the disable shadows → check whether the disable is needed. If removing it leaves lint clean, delete. If removing causes a new error, the disable was protecting a real violation — leave the disable AND verify the violation is intentional (add a brief justification comment if missing).
- **Rule we don't configure but plausibly desired** (rare — only seen if upstream rule set shifted) → leave the disable, file a follow-up issue.

Default action for ambiguous cases: delete the orphan, verify lint stays clean.

- [ ] **Step 5: Apply deletions/edits**

For each file in the categorization above, edit out the orphan disable comments. Use the Edit tool with enough surrounding context to make matches unique.

- [ ] **Step 6: Re-run lint per workspace, verify each clean**

```bash
cd server && npm run lint
cd marketplace && npm run lint
cd plugins && npm run lint
```

Expected: each exits 0. If any workspace still reports "unused eslint-disable" warnings, repeat Steps 4-5 for the remaining findings.

### Phase C — Flip to error

- [ ] **Step 7: Change `'warn'` to `'error'` in all three configs**

In each of `server/eslint.config.js`, `marketplace/eslint.config.cjs`, `plugins/eslint.config.js`, locate the `reportUnusedDisableDirectives` line added in Step 1 and replace `"warn"` / `'warn'` with `"error"` / `'error'` to match each file's quoting convention.

- [ ] **Step 8: Verify all three lints exit 0**

```bash
cd server && npm run lint
cd marketplace && npm run lint
cd plugins && npm run lint
```

Expected: all exit 0. If any errors out with "Unused eslint-disable directive", repeat Phase B for missed orphans.

- [ ] **Step 9: Pre-commit dry-run smoke test**

Pick one file in each workspace that doesn't currently have changes, touch it harmlessly (add and remove a blank line):

```bash
echo "" >> server/src/modules/plugins/service.ts
echo "" >> marketplace/plugins/quickbooks/lib/index.ts
echo "" >> plugins/packages/snowflake/lib/index.ts
git add server/src/modules/plugins/service.ts marketplace/plugins/quickbooks/lib/index.ts plugins/packages/snowflake/lib/index.ts
npx lint-staged
```

Expected: lint-staged dispatches eslint per workspace, all three eslint runs exit 0, lint-staged reports `[COMPLETED]` for each task.

Reset the dummy changes after smoke test:

```bash
git restore --staged server/src/modules/plugins/service.ts marketplace/plugins/quickbooks/lib/index.ts plugins/packages/snowflake/lib/index.ts
git checkout server/src/modules/plugins/service.ts marketplace/plugins/quickbooks/lib/index.ts plugins/packages/snowflake/lib/index.ts
```

- [ ] **Step 10: Stage and commit**

The commit covers the three config edits plus any orphan-cleanup source edits from Phase B. Stage everything:

```bash
git add server/eslint.config.js marketplace/eslint.config.cjs plugins/eslint.config.js
# Add any source files cleaned up in Phase B — list will depend on what was found
git add <any-cleanup-paths>
git commit -m "chore: enable reportUnusedDisableDirectives across flat configs

Set linterOptions.reportUnusedDisableDirectives to 'error' in server,
marketplace, and plugins flat configs so dead eslint-disable comments
fail CI instead of silently accumulating. Frontend keeps its 'off'
setting (deliberate — see in-file comment).

Pre-audit surfaced <N> orphan disables (mostly stale @typescript-eslint/ban-types
references removed in typescript-eslint v8); cleaned up in this commit."
```

If any orphan-cleanup edits are inside the server/ee submodule, commit them there first (separate submodule commit) and stage `server/ee` pointer in the root commit, mirroring Task 1's flow.

---

## Task 4: Push the branch

- [ ] **Step 1: Push root + any submodules**

```bash
git -C server/ee push origin feature/ci-rehab 2>&1 | tail -3   # only if Task 1 or Task 3 produced submodule commits
git push origin feature/ci-rehab 2>&1 | tail -3
```

Expected: each push reports the new SHA range.

- [ ] **Step 2: Verify CI starts on GitHub**

Open `https://github.com/ToolJet/ToolJet/actions?query=branch%3Afeature%2Fci-rehab` (or `gh run list --branch feature/ci-rehab --limit 1`). Wait for the lint job. Expected: green.

---

## Self-Review

**Spec coverage:**
- Section 1 (re-port server rules) → Task 1
- Section 2 (pre-audit + reportUnusedDisableDirectives) → Task 3 Phases A, B, C
- Section 3 (nocodb fix + rule re-enable) → Task 2
- Sequencing (three commits) → Tasks 1, 2, 3 produce one commit each (Task 1 additionally produces a submodule commit; Task 3 may add a submodule commit if orphan cleanup hits server/ee)
- Verification → built into the verify steps + Task 4 CI check
- Rollback → spec's rollback covered by independent commits; Phase A scope-guard codified in Step 3

No spec gaps.

**Placeholder scan:** Task 3 Phase B intentionally has "TBD by Phase A output" for the file list — this is a categorization step, not a placeholder; the procedure is explicit. No "TODO", "implement later", "appropriate error handling", or similar.

**Type/name consistency:** All references match across tasks (`linterOptions`, `reportUnusedDisableDirectives`, `varsIgnorePattern`, `'no-constant-binary-expression'`). Each rule name spelled identically to its eslint canonical form.
