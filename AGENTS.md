# ToolJet — Agent Context

Guidance for AI coding agents (and humans) working in this repo. Canonical file: `AGENTS.md`; `CLAUDE.md` is a symlink to it. Deeper context lives closest to the code — see [Context file layout](#context-file-layout).

## Architecture

Three editions: `ce` (community), `ee` (enterprise), `cloud`. Controlled by `TOOLJET_EDITION` env var.

### Editions & submodules

- CE code lives in `server/src/modules/` and `frontend/src/`
- EE/Cloud code lives in git submodules: `server/ee/` and `frontend/ee/`
- Cloud is a deployment config of EE, not a third code tree: `TOOLJET_EDITION=cloud` runs the same EE submodule code, with cloud-only behavior gated by runtime checks

### Backend (NestJS + TypeORM + PostgreSQL)

Edition pattern: **inheritance**. EE services extend CE base classes.

- `SubModule` base class (`server/src/modules/app/sub-module.ts`) — every module extends this
- `getImportPath()` (`server/src/modules/app/constants/index.ts`) — routes to `src/modules/` (CE) or `ee/` (EE/Cloud) based on `TOOLJET_EDITION`
- EE services extend CE services and call `super()` (e.g., `server/ee/data-queries/service.ts` extends `server/src/modules/data-queries/service.ts`)
- `getTooljetEdition()` (`server/src/helpers/utils.helper.ts`) — runtime edition check

Backend conventions in detail: `server/AGENTS.md`.

### Frontend (React + Webpack)

Edition pattern: **composition** via registries + webpack module replacement.

- Webpack aliases: `@/` → `src/`, `@ee/` → `ee/`, `@cloud/` → `cloud/`
- `NormalModuleReplacementPlugin` replaces `@ee/` and `@cloud/` imports with empty modules for lower editions (compile-time isolation)
- Runtime registries resolve edition-specific modules, components, stores, and slices:
  - `frontend/src/modules/common/helpers/_registry/moduleRegistry.js`
  - `frontend/src/modules/common/helpers/_registry/componentRegistry.js`
  - `frontend/src/modules/common/helpers/getEditionSpecificStores.js`
- `fetchEdition()` (`frontend/src/modules/common/helpers/utils.js`) — runtime edition check

Frontend conventions, App Builder architecture and glossary: `frontend/AGENTS.md`.

## Project structure

```
server/          # NestJS backend
frontend/        # React + Webpack
plugins/         # Built-in data source connectors (Lerna monorepo, 40+ packages)
marketplace/     # Third-party marketplace plugins
cypress-tests/   # E2E tests (Cypress)
docker/          # Dockerfiles per edition
deploy/          # K8s, Helm, Docker deploy configs
```

## Domain terminology

`UBIQUITOUS_LANGUAGE.md` at repo root is the canonical glossary. Notable traps:

- **Organization** (code entity) = **Workspace** (user-facing term). Same concept.
- **Widget** (legacy) = **Component**.
- **Module** is overloaded: NestJS module (backend) vs reusable app building block (frontend/EE feature). Qualify which you mean.
- Never abbreviate `data_source` as `ds`.

## Node version

`server/package.json` `engines` field is the source of truth; root `.nvmrc` / `.node-version` mirror it. Always `nvm use` before running Node commands — required version differs across branch lines.

## Dev commands

```
cd server && npm run start:dev      # start backend (port from .env PORT)
cd frontend && npm start            # start frontend
cd server && npm run db:setup       # setup database
cd server && npm run db:migrate     # run migrations
cd server && npm test               # run tests
```

### Plugins build (required for migrations)

`db:migrate` depends on `@tooljet/plugins/dist/server`:

```
cd plugins && npm install && npm run build
```

## Key conventions

- Database name convention: `tooljet_{edition}` (see `PG_DB` in `.env`)
- TypeORM schema migrations in `server/src/migrations/` (and `server/ee/migrations/` for EE); data migrations in `server/data-migrations/`
- Never import `@ee/` or `@cloud/` from CE code — webpack enforces this at compile time
- Backend port reads from `PORT` in `.env`; frontend port via `npm start -- --port <port>`
- Lint before committing. Pre-commit hooks are in the repo (husky + lint-staged, activated by root `npm install`); the hook only lint-fixes frontend files — backend needs `cd server && npm run lint` manually. CI lints all three folders and blocks the PR on failure. Never `--no-verify` unless the user explicitly asks

## Skills

Procedures live in `.agents/skills/` (symlinked into `.claude/skills/`). Load the one matching the task instead of improvising — ToolJet is a superproject with two submodules, and every git operation has to fan out across all three in a fixed order.

| Task | Skill |
|---|---|
| Merge a branch across root + submodules | `merge` |
| Commit across root + submodules | `commit` |
| Push and open PRs across root + submodules | `create-pr` |

## Context file layout

Context is layered — the closest file to the code you're changing wins:

| File | Scope |
|---|---|
| `AGENTS.md` (this file) | Repo-wide architecture, editions, structure |
| `UBIQUITOUS_LANGUAGE.md` | Canonical domain glossary |
| `server/AGENTS.md` | Backend + testing conventions |
| `server/src/modules/<module>/AGENTS.md` | Per-module purpose, key files, invariants |
| `server/ee/AGENTS.md` | EE-extends-CE rules (in EE submodule) |
| `frontend/AGENTS.md` | Frontend conventions, App Builder architecture, glossary |
| `server/docs/testing.md` | Backend testing — what to test, then how to write it |

**Living-docs rule:** when you meaningfully change a module (new service, changed invariant, renamed concept, new gotcha discovered), update its `AGENTS.md` in the same PR. If the module has none yet, create one from `server/docs/agents-module-template.md`. Introducing or renaming a domain term means updating `UBIQUITOUS_LANGUAGE.md` in the same PR — every glossary term should map to a real code identifier or user-facing feature. Stale context is worse than no context.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
