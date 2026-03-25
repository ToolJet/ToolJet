# Branching Toggle Flow: OLD vs NEW Architecture

**Example:** `pullGitAppChanges` in HTTPS provider (the method that already has the toggle today)

---

## OLD Architecture: Adding Toggle to All 3 Providers

### HTTPS (already has toggle)

```
HTTPSAppGitService.pullGitAppChanges()
  │
  ├── delegates to httpsAppGitUtilityService.pullGitAppChanges()
  │
  └── httpsAppGitUtilityService.pullGitAppChanges()
        │
        ├── orgGit = findOrgGitByOrganizationId()
        │
        ├── if (orgGit.isBranchingEnabled) ?
        │     │
        │     ├── YES ──► pullLatestChangesWithBranching()    (216 lines)
        │     │            ├── clone with depth 100
        │     │            ├── resolve version by branch
        │     │            ├── handle tags
        │     │            └── import with branch-aware logic
        │     │
        │     └── NO  ──► pullGitAppChangesWithoutBranching()  (110 lines)
        │                  ├── clone with depth 1
        │                  └── simple import
        │
        └── done
```

### SSH (needs toggle added)

```
SSHAppGitService.pullGitAppChanges()        ← 89 lines, NO toggle today
  │
  ├── orgGit = findOrgGitByOrganizationId()
  ├── gitClone(gitRepoPath, orgGit)                      ← always depth 1
  ├── readAppJson()
  ├── import TJ DB
  ├── validate + delete version + re-import
  └── updateAppGit()

  TO ADD TOGGLE, you must:
  ┌──────────────────────────────────────────────────────────┐
  │  1. Copy the toggle check from HTTPS                      │
  │  2. Write pullLatestChangesWithBranching() for SSH         │
  │     (~200 lines, reimplemented with SSH auth)              │
  │  3. Rename existing logic to pullWithoutBranching()        │
  │  4. Add the if/else dispatch                               │
  │  5. Duplicate all version resolution logic from HTTPS      │
  │  6. Duplicate all tag handling from HTTPS                  │
  └──────────────────────────────────────────────────────────┘
```

### GitLab (needs toggle added)

```
GitLabAppGitService.pullGitAppChanges()     ← 87 lines, NO toggle today
  │
  ├── Same as SSH ── no toggle
  │
  TO ADD TOGGLE:
  ┌──────────────────────────────────────────────────────────┐
  │  Same 6 steps as SSH above                                │
  │  Another ~200 lines reimplemented with GitLab auth        │
  │  Same version resolution logic duplicated AGAIN           │
  │  Same tag handling duplicated AGAIN                       │
  └──────────────────────────────────────────────────────────┘
```

### OLD: Total Work for Toggle

```
HTTPS:  Already done (toggle exists)
SSH:    +200 lines new branching logic + toggle dispatch
GitLab: +200 lines new branching logic + toggle dispatch
                                          ─────────────
                                          ~400 new lines
                                          3 copies of same branching logic
                                          3 files to maintain
```

---

## NEW Architecture: Adding Toggle Once

### All 3 Providers Share One Implementation

```
SSHAppGitService.pullGitAppChanges()
  │                                          HTTPSAppGitService.pullGitAppChanges()
  │                                            │
  │  return this.appGitOpsUtil                  │  return this.appGitOpsUtil
  │    .pullGitAppChanges(..., this.ctx)        │    .pullGitAppChanges(..., this.ctx)
  │                                            │
  └──────────────┬─────────────────────────────┘
                 │                       GitLabAppGitService.pullGitAppChanges()
                 │                         │
                 │                         │  return this.appGitOpsUtil
                 │                         │    .pullGitAppChanges(..., this.ctx)
                 │                         │
                 └────────────┬────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │  AppGitOperationsUtil.pullGitAppChanges()    │
        │  (shared, ONE implementation)                │
        │                                              │
        │  orgGit = findOrgGitByOrganizationId()       │
        │                                              │
        │  if (orgGit.isBranchingEnabled) ?            │  ← toggle in ONE place
        │     │                                        │
        │     ├── YES ──► pullWithBranching()           │  ← written ONCE
        │     │            ├── ctx.utilService.gitClone │
        │     │            │     (depth: 100)           │
        │     │            ├── resolve version          │
        │     │            ├── handle tags              │
        │     │            └── import with branch logic │
        │     │                                        │
        │     └── NO  ──► pullWithoutBranching()        │  ← written ONCE
        │                  ├── ctx.utilService.gitClone │
        │                  │     (depth: 1)             │
        │                  └── simple import            │
        │                                              │
        └──────────────────────────────────────────────┘
                              │
              ctx.utilService.gitClone() calls:
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        SSH getAuth()   HTTPS getAuth()  GitLab getAuth()
              │               │               │
              ▼               ▼               ▼
        ┌─────────────────────────────────────────────┐
        │  GitOperationsUtil.clone()                   │
        │  (shared, provider-agnostic)                 │
        │  Same git.clone() for all 3                  │
        └─────────────────────────────────────────────┘
```

### NEW: Total Work for Toggle

```
Shared util:  Toggle check + branching logic written ONCE
SSH:          0 lines (inherits from shared)
HTTPS:        0 lines (inherits from shared)
GitLab:       0 lines (inherits from shared)
                                          ─────────────
                                          ~200 lines total (not 400)
                                          1 copy of branching logic
                                          1 file to maintain
```

---

## Side-by-Side Comparison

```
OLD: Adding isBranchingEnabled to pullGitAppChanges
────────────────────────────────────────────────────

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │ SSH service  │   │HTTPS service│   │GitLab service│
  │              │   │             │   │              │
  │ if(toggle)?  │   │ if(toggle)? │   │ if(toggle)?  │
  │  ├─YES:200L  │   │  ├─YES:216L │   │  ├─YES:200L  │
  │  └─NO: 89L   │   │  └─NO :110L │   │  └─NO: 87L   │
  │              │   │             │   │              │
  │ SSH auth     │   │ HTTPS auth  │   │ GitLab auth  │
  │ mixed in     │   │ mixed in    │   │ mixed in     │
  └──────────────┘   └─────────────┘   └──────────────┘

  3 toggle checks
  3 copies of branching logic (~600 lines)
  Bug fix = patch 3 files


NEW: Adding isBranchingEnabled to pullGitAppChanges
────────────────────────────────────────────────────

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │ SSH service  │   │HTTPS service│   │GitLab service│
  │  (1 line)    │   │  (1 line)   │   │  (1 line)    │
  │  delegate ───┼───┼── delegate ─┼───┼── delegate   │
  └──────┬───────┘   └──────┬──────┘   └──────┬───────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │  Shared util     │
                   │                  │
                   │  if(toggle)?     │  ← ONE check
                   │   ├─YES: 200L   │  ← ONE copy
                   │   └─NO : 100L   │  ← ONE copy
                   │                  │
                   │  calls provider  │
                   │  via context     │
                   └──────────────────┘

  1 toggle check
  1 copy of branching logic (~300 lines)
  Bug fix = patch 1 file
```

---

## Another Example: `gitPushApp` with Toggle

### OLD

```
SSH gitPushApp (80 lines):
  ├── validate
  ├── clone
  ├── write files
  ├── commit
  ├── push to DEFAULT branch         ← no branching awareness
  └── save

  TO ADD TOGGLE:
  ├── if (isBranchingEnabled)
  │     ├── determine target branch (version branch or default?)
  │     ├── check allowMasterPush
  │     └── push to COMPUTED branch
  └── else
        └── push to default branch (current behavior)

  REPEAT for GitLab (another 80 lines + toggle logic)
```

### NEW

```
Shared gitPushApp (written once):
  ├── validate
  ├── clone
  ├── write files
  ├── commit
  ├── if (isBranchingEnabled)          ← ONE place
  │     ├── determine target branch
  │     ├── check allowMasterPush
  │     └── ctx.utilService.push(computedBranch)
  └── else
        └── ctx.utilService.push(defaultBranch)

  SSH/HTTPS/GitLab all use this. Zero duplication.
```
