# Git-Sync Tests — How to Run

Single reference for every command, config, and env knob used to run the git-sync test suites
(unit + e2e) and produce coverage. For the e2e **case catalog** (what each test asserts) see
[`e2e/lifecycle-cases.md`](./e2e/lifecycle-cases.md).

The "git-sync family" spans these test dirs:
`git-sync`, `git-sync-configs`, `git-sync-webhooks`, `platform-git-sync`, `workspace-branches`, `app-git`.

---

## TL;DR

```bash
# From server/
npm run test:gitsync:unit        # fast, host-free unit specs (no DB / no git host)
npm run test:gitsync:e2e         # e2e specs — needs the git simulator + DB (see Env below)
npm run test:gitsync             # unit then e2e

# Coverage
npm run test:cov:gitsync:unit    # unit coverage      → coverage-gitsync-unit/
npm run test:e2e:cov:gitsync     # e2e coverage       → coverage-gitsync/
npm run test:cov:gitsync:merge   # combine both       → coverage-gitsync-combined/ + prints totals
```

---

## Separation: git-sync runs on its own (`@group gitsync`)

**Every git-sync spec (unit + e2e) carries `@group gitsync`** — the jest-runner-groups tag. This is what
lets git-sync run **separately** from the core suite (it depends on the external git simulator, so it
must not be coupled to the general test runs). Two directions:

- **Run only git-sync:** `--group=gitsync` → `test:gitsync:*`.
- **Run everything except git-sync:** `--group=-gitsync` → `test:core:*` (this is what CI's `test-server`
  job uses for its unit + e2e steps).

⚠️ **New git-sync specs MUST include `@group gitsync`** in their first docblock. Without it, the spec is
neither excluded from the core run nor picked up by the git-sync run. The six git-sync dirs are
`git-sync`, `git-sync-configs`, `git-sync-webhooks`, `platform-git-sync`, `workspace-branches`, `app-git`.

## npm scripts

| Script | What it runs | Needs |
|---|---|---|
| `test:gitsync:unit` | git-sync **unit** specs (`jest.config.ts --group=gitsync`) | nothing (host-free) |
| `test:gitsync:e2e` | git-sync **e2e** specs via `run-e2e.sh --group=gitsync` (sharded) | git simulator + DB |
| `test:gitsync` | `test:gitsync:unit` then `test:gitsync:e2e` | git simulator + DB |
| `test:core:unit` | All **non**-git-sync unit specs (`jest.config.ts --group=-gitsync`) | DB (per the general unit run) |
| `test:core:e2e` | All **non**-git-sync e2e specs (`run-e2e.sh --group=-gitsync`) | DB |
| `test:cov:gitsync:unit` | git-sync unit coverage (`test/jest-unit.gitsync-cov.config.ts`) → `coverage-gitsync-unit/lcov.info` | nothing |
| `test:e2e:cov:gitsync` | git-sync e2e coverage (`test/jest-e2e.gitsync-cov.config.ts`) → `coverage-gitsync/lcov.info` | git simulator + DB |
| `test:cov:gitsync:merge` | Union-merge unit + e2e lcov (`scripts/merge-lcov.mjs`) → `coverage-gitsync-combined/lcov.info` + totals | the two runs above |

> **jest v30 note:** the flag is `--testPathPatterns` (plural). `--testPathPattern` (singular) is silently ignored.
> The coverage configs still select git-sync by path (`testRegex`), independent of the `@group` tag.

### CI (`.github/workflows/ci.yml`)

Git-sync is a **dedicated job** (`test-gitsync`), not part of `test-server`:
- `test-server` runs the core suite with `--group=-gitsync` on both its unit and e2e steps (git env removed).
- `test-gitsync` (parallel job) runs `test:gitsync` with the git simulator secrets **plus `TEST_GITLAB_TOKEN`**
  so the un-quarantined GitLab suite executes in CI. It feeds `ci-gate` (a failure blocks the merge).
- In `changed` mode, the fast lane (`test-changed`) still runs git-sync when a git-sync file is touched.

> **Action required to enable GitLab in CI:** add the repo secret **`GIT_SYNC_GITLAB_TOKEN`** (matching the
> simulator's `EXPECTED_GITLAB_TOKEN`). Without it the GitLab spec self-skips and `test-gitsync` stays green.

---

## Jest configs

| Config | Purpose | testRegex / scope |
|---|---|---|
| `jest.config.ts` | Base **unit** config | `test/modules/.*/unit/.*spec.ts` |
| `test/jest-e2e.config.ts` | Base **e2e** config | `test/modules/.*/e2e/.*spec.ts` |
| `test/jest-e2e.gitsync-cov.config.ts` | e2e coverage, narrowed to the git-sync source surface | `(git-sync\|git-sync-webhooks)/e2e/` |
| `test/jest-unit.gitsync-cov.config.ts` | Unit coverage, **same `collectCoverageFrom`** as the e2e cov config (so the two can be merged) | git-sync-family `/unit/` |

The two `*gitsync-cov*` configs share one `collectCoverageFrom` list (EE providers + CE stubs, minus
`*.module.ts` / `*.entity.ts` / `*.dto.ts` / interfaces / types / CE no-op stubs). Keep them in sync.

---

## Environment (e2e only)

The e2e specs hit a **real git host** (a Gitea/GitHub-Enterprise + GitLab-shaped simulator). Required env:

| Var | Used by | Notes |
|---|---|---|
| `TEST_GIT_BASE_URL` | GitHub + GitLab | Simulator host (shared) |
| `TOOLJET_GITHUB_APP_ID` / `TOOLJET_GITHUB_INSTALLATION_ID` / `TOOLJET_GITHUB_APP_PRIVATE_KEY` | GitHub | GitHub App auth |
| `TEST_GITLAB_TOKEN` | GitLab | Must equal the simulator's `EXPECTED_GITLAB_TOKEN` |
| `TOOLJET_GIT_ADMIN_USER` / `TOOLJET_GIT_ADMIN_PASSWORD` | both | Simulator admin endpoints (reset / merge / files) |
| `PG_*` / `TOOLJET_DB` | both | Test DB (auto-loaded by `run-e2e.sh`) |

**`run-e2e.sh` only auto-loads `PG_*` / `TOOLJET_DB` from `../.env.test`** — the git vars must already be
in the shell environment.

⚠️ **Do not `source ../.env.test`** to load them: the file stores `TOOLJET_GITHUB_APP_PRIVATE_KEY` as a
single unquoted line with spaces, so `source`/`set -a` chokes (`command not found: RSA`). Load it with a
**dotenv** preloader instead, which parses the file correctly:

```bash
# One-off wrapper (Node + dotenv → run any npm script with .env.test loaded):
node -e "require('dotenv').config({path:'../.env.test'}); \
  require('child_process').spawn('npm',['run','test:gitsync:e2e'],{stdio:'inherit',env:process.env})"
```

(If your shell profile already exports the git vars, plain `npm run test:gitsync:e2e` works.)

### Per-run repo isolation

`run-e2e.sh` mints **one** fresh repo per invocation and exports it to every shard:

- `TEST_GIT_REPO_PATH=run-ci/<uuid>` (GitHub)
- `TEST_GITLAB_REPO_PATH=run-ci/<uuid>-gitlab` (GitLab)

Generated once (not per shard/spec), so a single `npm run test:gitsync` touches exactly one repo, which
the simulator's reset endpoint auto-creates. Pin a specific repo by exporting `TEST_GIT_REPO_PATH` /
`TEST_GITLAB_REPO_PATH` yourself — the runner respects a set value and only falls back to `run-ci/<uuid>`.
Running a spec directly via `jest` (bypassing `run-e2e.sh`) uses the in-spec static default
(`gsmithun4/e2e`, `gsmithun4/gitlab-e2e`).

### GitLab is NOT quarantined

`git-sync-gitlab.spec.ts` runs under the normal e2e flow. It **self-guards**: with the GitLab env present
it executes for real; when any of `TEST_GITLAB_TOKEN` / `TEST_GIT_BASE_URL` / `TOOLJET_GIT_ADMIN_*` is
missing it prints `[git-sync-gitlab] SKIPPED …` and skips the whole suite at runtime (rather than throwing
at import), so a GitLab-less `npm run test:e2e` stays green.

---

## Running a single spec / test

```bash
# One unit spec (host-free):
SKIP_GLOBAL_SETUP=true NODE_ENV=test npx jest --config jest.config.ts --runInBand \
  test/modules/git-sync/unit/git-tree-sha.util.spec.ts

# One e2e file / test (git env must be loaded first — see Environment):
npm run test:e2e -- --testPathPatterns 'git-sync-gitlab'
npm run test:e2e -- --testPathPatterns 'git-sync' -t 'single-branch lifecycle'
```

---

## Coverage — combined (unit + e2e)

The e2e cov config emits `lcovonly` (not istanbul `json`), so the repo's `scripts/merge-coverage.mjs`
(which needs `coverage-final.json`) can't combine the two. Instead merge at the **lcov** level:

```bash
# 1. unit coverage (fast, host-free)     → coverage-gitsync-unit/lcov.info
npm run test:cov:gitsync:unit

# 2. e2e coverage (slow, needs git+DB)   → coverage-gitsync/lcov.info
#    (load .env.test git vars first — see Environment)
npm run test:e2e:cov:gitsync

# 3. union-merge → coverage-gitsync-combined/lcov.info + prints combined line/fn/branch totals
npm run test:cov:gitsync:merge
```

`merge-lcov.mjs` treats a line/branch/function as covered if hit by **either** suite. Lines is the clean
apples-to-apples metric (the v8 provider reports statements == lines). Browse the HTML at
`coverage-gitsync/index.html` (e2e view) or run `genhtml coverage-gitsync-combined/lcov.info -o <dir>`
for the combined HTML if the `lcov` CLI is installed.

### Latest numbers

| Run | Lines |
|---|---|
| Baseline (pre-work) | 54.68% |
| e2e-only | 60.08% |
| Combined (unit + e2e) — before targeted unit push | 63.88% |
| Combined (unit + e2e) — after unit batch | 66.82% |
| Combined (unit + e2e) — after createGitApp import (§22) | 69.23% |
| **Combined (unit + e2e) — current** | **70.32%** (17373/24707) |

The e2e push added per-app import scenarios (§22 import + §23 **tag** import in `lifecycle-cases.md`)
exercising `AppGitOperationsUtil.createGitApp` / `importTagVersion`, taking
`app-git/shared/app-git-operations.util.ts` from ~21% to **~50%**. The GitLab tag-import mirror also
**surfaced (and fixed) a real product bug** — the GitLab app-git provider was missing `checkoutCommitHash`,
so GitLab tag imports crashed (`ee/app-git/providers/gitlab/util.service.ts`). Remaining gaps in that file
(module-reference hydration, `gitPushApp` error branches, `pullGitAppChanges`/`checkSyncApp`) plus
`app-git/providers/github-https/*` are the next e2e targets.
