# tj: ToolJet dev toolkit

Worktrees, env files, databases and dev servers for working on ToolJet. TypeScript run straight from source on the `.nvmrc` Node: no build step, no runtime dependencies.

```bash
tools/tj/bin/tj help                 # all commands; `tj <command> --help` for one
```

To type just `tj`, put this launcher on your `PATH`. It runs the copy in whichever checkout or worktree you're in, so each branch uses its own version, and it works in non-interactive shells too:

```bash
mkdir -p ~/.local/bin && cat > ~/.local/bin/tj <<'EOF'
#!/bin/sh
root=$(git rev-parse --show-superproject-working-tree --show-toplevel 2>/dev/null | head -1)
[ -x "$root/tools/tj/bin/tj" ] || { echo "tj: not inside a ToolJet checkout" >&2; exit 2; }
exec "$root/tools/tj/bin/tj" "$@"
EOF
chmod +x ~/.local/bin/tj    # ~/.local/bin must be on PATH
```

Don't add `tools/tj/bin` itself to `PATH`. That pins one checkout's copy, and inside a worktree you'd silently run the wrong version. Scripts and coding agents call `tools/tj/bin/tj` from the repo root, which needs no setup.

## Common flows

```bash
tj doctor                            # prerequisites, with a fix hint for each failure
tj wt add feat/x --app               # worktree + submodules + deps + test & dev DBs + free ports
cd "$(tj wt path feat/x)"
tj start                             # server + frontend in the background, waits for health
tj status && tj logs server -f
tj stop
tj wt rm feat/x --yes                # stop, drop its DBs, remove the worktree (refuses on unsaved work)
tj db migrate --test                 # migrate the test DB (NODE_ENV=test alone is a no-op)
```

## Output contract

- **stdout is data.** With `--json` it's one document, `{ "schemaVersion": 1, "ok": true, ... }`. Errors have `ok: false` and `error: { message, hint, exitCode }`.
- **stderr is progress.**
  - On a terminal: `› step`, `✔ ok`, `⚠ warn`, `✖ fail`, `· info`, `→ hint`.
  - When piped, in CI, or under a coding agent: `step:`, `ok:`, `warn:`, `fail:`, `info:`, `hint:` lines with no colour.
  - `NO_COLOR` is respected.
- **Exit codes:** `0` ok, `1` failed, `2` usage, `3` not ready (health timeout).
- **Never prompts** without a terminal. Destructive commands need `--yes` there.
- Subprocess output goes to `.tj/logs/<name>.log`, or stderr with `--verbose`. On failure the log tail is shown.

## State

Per checkout, in `.tj/` (gitignored): `state.json` (ports, DB names, dependency hashes), `run/<svc>.json` (pid, port), `logs/`.

- **Worktree layout:**
  - Worktrees live in `.worktrees/<slug>_<hash>`.
  - DB names are `tooljet_<slug>_<hash>[_test]`. They are unique per branch and stay under Postgres' 63-char limit, even with the e2e runner's shard suffix.
- **Submodules:** a worktree clones them from the main checkout's local module repos, so unpushed EE branches are visible.
- **Dependencies:** before running `npm ci`, setup looks for another checkout whose installed `node_modules` matches this lockfile (npm's `node_modules/.package-lock.json`) and copies it copy-on-write (APFS clonefile, or reflink on Linux). A plugins build is copied the same way from a checkout that recorded one for the same `plugins` tree. `--force` always reinstalls.
- **Env files:** a worktree gets its own `.env.test` and, with `--app`, its own `.env`. Test-DB commands move `.env` aside while they run, because the server's config loader merges `.env` over the environment.

## Adding a command

1. Add `src/commands/<name>.ts` exporting a `Command`: `name`, `summary`, `usage`, `options`, `run`.
2. Register it in `src/main.ts`. Help and `tj help --json` come from that table.
3. Report results through `emit(data, render)` and progress through `ui.*`. Never write progress to stdout.
4. Throw `TjError(message, { hint, code })` for failures.

Keep the TypeScript strip-safe: no enums, namespaces or parameter properties; `.ts` import extensions; `import type`.

`npm run tj:check` type-checks and runs the tests. Pre-commit runs it when `tools/tj/` changes.
