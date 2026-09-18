---
name: task
description: >-
  Command reference for the ToolJet taskfile setup. Use before running ANY
  test, migration, db, dev, lint, or worktree command in the ToolJet repo.
  Never guess npm/ts-node commands — always derive the task command from this
  skill first.
---

# ToolJet Taskfile Reference

All commands in this repo go through [go-task](https://taskfile.dev). The root `taskfile.yml` delegates to five namespaced taskfiles under `.local/`. **Never bypass this with raw `npm run` or `ts-node` calls.**

Run `task --list` from the repo root to see every available task.

---

## Command Reference

### Tests — `task test:*` (runs from `./server`)

| Task                                      | What it does                                            |
|-------------------------------------------|---------------------------------------------------------|
| `task test:server`                        | All unit tests                                          |
| `task test:server-watch`                  | Unit tests in watch mode                                |
| `task test:server-cov`                    | Unit tests with coverage                                |
| `task test:unit-filter -- <path-pattern>` | Unit tests matching a file path, e.g. `-- external-api` |
| `task test:unit-name -- <test-name>`      | Unit tests matching a test name, e.g. `-- buildConfigs` |
| `task test:unit-focus -- <path> <name>`   | Both path + name filter combined                        |
| `task test:e2e`                           | All e2e tests                                           |
| `task test:e2e-filter -- <path-pattern>`  | e2e tests matching a file path                          |
| `task test:e2e-name -- <test-name>`       | e2e tests matching a name pattern                       |
| `task test:e2e-focus -- <path> <name>`    | Both path + name filter combined                        |
| `task test:all`                           | Unit + frontend + plugins                               |

**Pattern examples:**
```bash
task test:e2e-filter -- external-api-users-metadata
task test:unit-focus -- login-configs buildConfigs
task test:e2e-focus -- form-auth 'Invite token'
```

### Database — `task db:*` (runs from `./server`)

| Task                        | What it does                           |
|-----------------------------|----------------------------------------|
| `task db:setup`             | Create + migrate                       |
| `task db:migrate`           | Run pending migrations (schema + data) |
| `task db:seed`              | Seed initial data                      |
| `task db:create`            | Create DB                              |
| `task db:drop`              | Drop DB                                |
| `task db:reset`             | Drop + re-setup                        |
| `task db:reset-from-branch` | Reset using branch-derived DB name     |

**Migrations are always run via `task db:migrate`** — this runs both schema migrations and data migrations in the correct order. Never run TypeORM CLI directly.

**Generate a new migration:**
```bash
# From ./server
npm run typeorm migration:generate -- src/migrations/<MigrationName> -d src/migration-helpers/db-migrations-datasource.ts
```
Only the generation step uses npm directly. Running it still goes through `task db:migrate`.

### Dev Servers — `task dev:*`

| Task                | What it does                         |
|---------------------|--------------------------------------|
| `task dev:frontend` | Start frontend dev server            |
| `task dev:server`   | Start server in dev mode             |
| `task dev:plugins`  | Start plugins compiler in watch mode |
| `task dev`          | Frontend + server together           |

### QA / Lint — `task qa:*`

| Task             | What it does                     |
|------------------|----------------------------------|
| `task qa:lint`   | Lint server + frontend + plugins |
| `task qa:format` | `eslint --fix` all packages      |

### Worktrees — `task wt:*`

| Task                               | What it does                                                     |
|------------------------------------|------------------------------------------------------------------|
| `task wt:add -- feat/my-branch`    | Create worktree for branch                                       |
| `task wt:remove -- feat/my-branch` | Remove worktree                                                  |
| `task wt:list`                     | List active worktrees                                            |
| `task wt:sync-local`               | Push `.local/` + `taskfile.yml` from this worktree to all others |
| `task wt:sync-submodules`          | Sync + update submodules                                         |

**`task wt:sync-local` is the canonical sync command.** Run it from the worktree where you made taskfile changes to propagate them everywhere. `worktree-add.sh` already copies `.local/` on creation, but existing worktrees need a manual sync after edits.

### Install / Build

| Task           | What it does                      |
|----------------|-----------------------------------|
| `task install` | Install deps for all packages     |
| `task build`   | Build plugins + frontend + server |

---

## Working Directory

- All `task` commands run from the **repo root** (`/path/to/ToolJet`).
- `taskfile.db.yml` and `taskfile.test.yml` have `dir: ./server` — the task runner `cd`s there automatically. You do not need to `cd server` before running them.

---

## If a Task Doesn't Exist

If the operation you need isn't covered by an existing task:
1. Check `task --list` — it may exist under a different name.
2. If genuinely missing, **tell the user and propose adding it to the relevant `.local/taskfile.*.yml`** — don't bypass the system with a raw command.

## Never Do

- `npm run test` from root → use `task test:server`
- `npm run test:e2e` from root → use `task test:e2e`
- `npm run db:migrate` from root → use `task db:migrate`
- `ts-node ... migration:run ...` → use `task db:migrate`
- `cd server && npm run test` → use `task test:server` from root
