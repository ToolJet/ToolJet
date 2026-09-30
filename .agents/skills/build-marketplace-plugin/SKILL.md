---
name: build-marketplace-plugin
description: >-
  Create or validate a ToolJet marketplace data-source plugin from an OpenAPI spec,
  Postman collection, npm package, database driver, or API docs. Use when asked to
  create, generate, scaffold, or validate a marketplace plugin or connector.
---

# Build a marketplace plugin

Turn an API source into a working plugin under `marketplace/plugins/<id>/`: a connection form
(`manifest.json`), a query form (`operations.json`), and a `QueryService` (`index.ts`). The
repo-owned validator is the gate, not this document.

Read `marketplace/AGENTS.md` first. It owns the codebase facts (layout, registry, build, OAuth
widget, `customTesting`, `@spec/` hosting); this skill links to it rather than repeating it.

To validate an existing plugin only, skip to step 5.

## 1. Intake

Ask one question at a time. Skip any the user already answered.

| # | Question | Notes |
|---|---|---|
| 1 | Display name and plugin id? | id: lowercase, `[a-z][a-z0-9_-]*`, e.g. "Stripe" / `stripe` |
| 2 | Plugin type? | `api`, `database`, or `cloud-storage` (the scaffold's `--type`) |
| 3 | PRD or requirements? | Issue URL, inline text, file path, or none |
| 4 | API source? | OpenAPI file or URL, Postman collection, npm package, docs URL, or a description |
| 5 | Icon? | SVG URL or path, or none (keep the scaffolded placeholder) |
| 6 | Design reference? | Figma link, screenshot, or none |
| 7 | Where to work? | Current branch or a new branch/worktree. Default: current branch |

Right after question 1, check the id is free:

```bash
grep -n '"id": "<id>"' server/src/assets/marketplace/plugins.json; ls marketplace/plugins/<id>
```

If either exists, stop and ask whether to update that plugin instead. Updating skips step 3 and
edits the existing files. Never add a second registry entry for the same id: the scaffold aborts
with "Plugin id already exists", and the validator fails on duplicates.

## 2. Spec

Produce `plugin-spec.json`, the contract both generators work from. Route by source:

| Source | Reference |
|---|---|
| OpenAPI spec (`.json`, `.yaml`, URL) | `references/intake-openapi.md` |
| Postman collection | `references/intake-postman.md`, then `references/intake-openapi.md` |
| npm package, DB driver, docs URL, description | `references/intake-docs.md` |

Validate it against `assets/plugin-spec.schema.json` (draft-07; ajv is installed in
`marketplace/`):

```bash
cd marketplace && node -e "const A=require('ajv'),fs=require('fs');const v=new A({allErrors:true}).compile(JSON.parse(fs.readFileSync(process.argv[1])));if(!v(JSON.parse(fs.readFileSync(process.argv[2]))))throw new Error(JSON.stringify(v.errors,null,1))" ../.agents/skills/build-marketplace-plugin/assets/plugin-spec.schema.json <path-to>/plugin-spec.json
```

Write `plugin-spec.json` outside the repo (or delete it before committing). It is an
intermediate artifact and is never committed.

**User gate.** Show the auth type, the operation list, `operationsMode`, and the schema version
(V1 unless the form needs cascading V2 widgets). Proceed only on a yes.

## 3. Scaffold

From the repo root:

```bash
npx tooljet plugin create <id> --type=<type> --marketplace
```

- It prompts for the display name, then a repository URL (leave blank). Without an interactive
  terminal, feed the answers with a pause between them:
  `(echo "<Display Name>"; sleep 2; echo) | npx tooljet plugin create <id> --type=<type> --marketplace`.
- `npx tooljet` resolves the `@tooljet/cli` pinned in the root `package.json`. Without
  `--marketplace` that version asks "is it a marketplace integration?" and a "no" scaffolds into
  `plugins/packages/` instead. If your CLI rejects the flag, drop it; the repo's `cli/` source
  always targets `marketplace/`.
- It renders `marketplace/_templates/plugin/new/`, runs `npm i` in `marketplace/`, and appends a
  `plugins.json` entry whose `name` is the id and whose `description` is generic. Fix both, and
  add `tags` and `"repo": ""` like the neighbouring entries.
- If the id contains `-`, rename the generated class in `lib/index.ts` to a valid identifier.
- Icon: save the provided SVG as `lib/icon.svg`, otherwise keep the placeholder.

Identity rule: the `plugins.json` `id` must equal the manifest `source.kind` (spec files are
looked up by that id). Keeping the directory name equal to the id is the convention the scaffold
follows, not something the code enforces. Never rename `kind` after release.

## 4. Generate

Two independent jobs, both fed `plugin-spec.json`, the PRD, the API source, and the plugin
directory:

- Backend, `lib/index.ts` and `lib/types.ts`: `references/backend.md`.
- Frontend, `lib/manifest.json`, `lib/operations.json`, `openapi-specs/`: `references/frontend.md`.

If your harness supports subagents, run them in parallel, one each, and pass the reference path
in the prompt. Otherwise do backend then frontend in this session. Both need
`references/manifest-and-operations.md` for widget and auth patterns.

## 5. Verify

Follow `references/verify.md`: build, `npm run validate:plugin -- <id>`, lint, spec coverage,
then an optional UI check. On failure, hand the exact error back to the job that owns the file and fix
only that. Stop after 3 fix rounds and report what still fails.

## 6. Hand-off

Report:

- Plugin path and registry entry.
- Operations, auth type, `operationsMode`.
- Verification results, each check marked pass, fail, or skipped with the reason.
- Anything the user must supply (OAuth app credentials, sandbox accounts).

Commit and open PRs with the repo's `commit` and `create-pr` skills. Commit `plugins.json`,
`marketplace/plugins/<id>/` and `marketplace/package-lock.json`; do not commit `dist/` or
`plugin-spec.json`.

## Common mistakes

| Mistake | Fix |
|---|---|
| `react-component-oauth-authentication` in a new manifest | Use `react-component-oauth` (`marketplace/AGENTS.md`) |
| `customTesting: true` while relying on the test-connection button | `true` hides the button. See `marketplace/AGENTS.md` |
| `@spec/` reference with no file in `openapi-specs/` | File name without extension must equal the `@spec/<id>/<name>` suffix |
| Hand-written operations for an OpenAPI source | Use `react-component-api-endpoint` with `@spec/` |
| Retrying a Postman share URL that returns HTML | Ask the user to export the collection file |
| Adding jest tests as a gate | Plugin tests are not wired up; verify with build + validator |
