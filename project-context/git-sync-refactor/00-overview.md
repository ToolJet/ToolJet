# Git Sync Architecture Overview

## What is Git Sync?

Git sync allows ToolJet workspaces to connect to a Git repository (GitHub SSH, GitHub HTTPS via GitHub App, or GitLab) and push/pull app definitions as JSON files. It's an **EE-only feature** gated by license (`LICENSE_FIELD.GIT_SYNC`).

## Architecture at a Glance

```
+-----------------------------------------------------+
|                    FRONTEND                          |
|  Workspace Settings -> Configure Git (Admin)        |
|  App Builder Header -> Push/Pull/Branch (Developer) |
|  State: Zustand (gitSyncSlice)                       |
|  API Client: git_sync.service.js                    |
+------------------------+----------------------------+
                         | REST API
+------------------------+----------------------------+
|                    BACKEND (NestJS)                  |
|                                                     |
|  Module 1: git-sync (org-level config)              |
|    -> POST/GET/PUT/DELETE /git-sync                 |
|                                                     |
|  Module 2: app-git (per-app push/pull)              |
|    -> POST/GET/PUT /app-git                         |
|                                                     |
|  Strategy Pattern:                                  |
|    SourceControlProviderService                     |
|      +-- SSHService (simple-git + SSH keys)         |
|      +-- HTTPSService (Octokit + GitHub App JWT)    |
|      +-- GitLabService (simple-git + access token)  |
|                                                     |
|  Base classes in CE (stubs) -> EE overrides (real)  |
+------------------------+----------------------------+
                         |
+------------------------+----------------------------+
|                    DATABASE                          |
|  organization_git_sync (1 per workspace)            |
|    +-- organization_git_ssh                         |
|    +-- organization_git_https                       |
|    +-- organization_gitlab                          |
|  app_git_sync (1 per synced app)                    |
+-----------------------------------------------------+
```

## Technology Stack

- **Git operations:** `simple-git` v3.27.0
- **GitHub API:** `@octokit/rest` (for HTTPS/GitHub App auth)
- **GitLab API:** `got` HTTP library (for validation)
- **SSH keys:** Node.js `crypto` + `sshpk` (key generation/conversion)
- **JWT:** `jsonwebtoken` + `node-forge` (GitHub App authentication)
- **Database:** TypeORM entities with PostgreSQL
- **Frontend state:** Zustand slices

## Key Design Decisions

1. **Strategy Pattern** — All three providers (SSH, HTTPS, GitLab) share the same interface, selected at runtime by `SourceControlProviderService`
2. **CE/EE Split** — CE has stub classes (throw NotFoundException), EE has real implementations loaded via dynamic imports
3. **Synchronous Operations** — All git ops (clone, push, pull) happen synchronously within the HTTP request lifecycle. No queue/job system.
4. **Shallow Clones** — Uses `--depth 1 --single-branch` for all git operations
5. **Temp Directory Pattern** — Each operation creates a temp directory, performs git ops, then cleans up

## Documentation Index

| File | Topic |
|------|-------|
| [01-database-schema.md](./01-database-schema.md) | Database tables, entities, and relationships |
| [02-ce-ee-module-pattern.md](./02-ce-ee-module-pattern.md) | How CE stubs get replaced by EE implementations |
| [03-provider-strategy-pattern.md](./03-provider-strategy-pattern.md) | Provider selection, shared interface, inheritance chain |
| [04-org-config-flow.md](./04-org-config-flow.md) | API endpoints and flows for workspace git configuration |
| [05-app-push-flow.md](./05-app-push-flow.md) | Complete push flow: export -> clone -> commit -> push |
| [06-refactoring-issues.md](./06-refactoring-issues.md) | All identified issues and refactoring opportunities |
| [07-frontend-architecture.md](./07-frontend-architecture.md) | Frontend components, state management, and UI flows |
| [08-pull-flow.md](./08-pull-flow.md) | Complete pull flow: metadata, import, destructive update |
| [10-refactoring-audit.md](./10-refactoring-audit.md) | Full refactoring audit: misplaced code, duplication, coupling, dead code |
| [11-deduplication-analysis.md](./11-deduplication-analysis.md) | Provider deduplication: method inventory, behavioral diffs, 2-layer approach, bugs found |
| [12-branching-toggle-analysis.md](./12-branching-toggle-analysis.md) | Branching toggle: OLD vs NEW architecture comparison, effort estimates |
| [13-final-refactoring-plan.md](./13-final-refactoring-plan.md) | Final execution plan: 7 commits, file changes, verification strategy |
| [14-architecture-flow-diagrams.md](./14-architecture-flow-diagrams.md) | Before/After flow diagrams: module structure, API flows, layer separation |
| [15-branching-toggle-flow-diagram.md](./15-branching-toggle-flow-diagram.md) | Branching toggle: OLD vs NEW flow for pullGitAppChanges and gitPushApp |
| [16-refactoring-timeline.md](./16-refactoring-timeline.md) | Refactoring timeline: 7 phases, file changes, transaction safety, estimation slots |
