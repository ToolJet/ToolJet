---
name: create-plugin
description: >-
  Create, build, generate, scaffold, update, or validate a ToolJet marketplace plugin
  (connector, integration, or data source) under marketplace/plugins/, from an OpenAPI
  spec, Postman collection, npm package, database driver, or API docs. Use for any
  request to add or check a ToolJet marketplace plugin, connector, or data source.
  Not for built-in connectors in plugins/packages/.
---

# Build a marketplace plugin

Turn an API source into a working plugin under `marketplace/plugins/<id>/`: a connection form
(`manifest.json`), a query form (`operations.json`), and a `QueryService` (`index.ts`). The
repo-owned validator is the gate, not this document. Built-in connectors in `plugins/packages/`
are out of scope; if asked for one, stop and say so.

Read `marketplace/AGENTS.md` first. It owns the codebase facts (layout, registry, build, OAuth
widget, `customTesting`, `@spec/` hosting); this skill links to it rather than repeating it.

To validate an existing plugin only, run step 5 and report with the checklist in
`references/verify.md` section 6; fix nothing unless asked.

## 1. Intake

Ask one question at a time. Skip any the user already answered. If the user says to use defaults,
state them: type `api`, no PRD, no icon, no design reference, current branch, version `1.0.0`, V1,
and a `tags` category (step 3).

| #   | Question                    | Notes                                                                            |
| --- | --------------------------- | -------------------------------------------------------------------------------- |
| 1   | Display name and plugin id? | id: lowercase, `[a-z][a-z0-9_-]*`, e.g. "Stripe" / `stripe`                      |
| 2   | Plugin type?                | `api`, `database`, or `cloud-storage` (the scaffold's `--type`)                  |
| 3   | PRD or requirements?        | Issue URL, inline text, file path, or none                                       |
| 4   | API source?                 | OpenAPI file or URL, Postman collection, npm package, docs URL, or a description |
| 5   | Icon?                       | SVG URL or path, or none (keep the scaffolded placeholder)                       |
| 6   | Design reference?           | Figma link, screenshot, or none                                                  |
| 7   | Where to work?              | Current branch or a new branch/worktree. Default: current branch                 |

Right after question 1, check the id is free, including built-in connector kinds:

```bash
grep -n '"id": "<id>"' server/src/assets/marketplace/plugins.json; ls marketplace/plugins/<id>
grep -l '"kind": "<id>"' plugins/packages/*/lib/manifest.json
```

A built-in match (e.g. `googlesheets`) means pick another id; the validator rejects it. A
marketplace match: stop and ask whether to update that plugin instead. Updating skips step 3 and
edits the existing files. Never add a second registry entry for the same id: the validator fails
on duplicates (the CLI would abort with "Plugin id already exists").

## 2. Spec

Produce `plugin-spec.json`, the contract both generators work from. Route by source:

| Source                                        | Reference                                                           |
| --------------------------------------------- | ------------------------------------------------------------------- |
| OpenAPI spec (`.json`, `.yaml`, URL)          | `references/intake-openapi.md`                                      |
| Postman collection                            | `references/intake-postman.md`, then `references/intake-openapi.md` |
| npm package, DB driver, docs URL, description | `references/intake-docs.md`                                         |

Write `plugin-spec.json` outside the repo (or delete it before committing). It is an
intermediate artifact and is never committed. Without subagents, it may stay in the conversation
instead of a file. Nothing validates it; the step 5 checks do.

**User gate.** Show the auth type, the operation list, `operationsMode`, and the schema version
(V1 unless the form needs cascading V2 widgets). Proceed only on a yes.

## 3. Scaffold

Render the repo's plugin templates directly, with no prompts. This is what `tooljet plugin create`
runs internally (the human path is in `marketplace/AGENTS.md`). Once per checkout, run
`npm install` at the repo root first (it provides `hygen`; takes a few minutes).

```bash
cd marketplace
../node_modules/.bin/hygen plugin new --name <id> --type <type> --display_name "<Display Name>" --plugins_path .
```

It writes `plugins/<id>/` (`lib/{index.ts,types.ts,manifest.json,operations.json,icon.svg}`,
`__tests__/index.js`, `package.json`, `tsconfig.json`, `README.md`, `.gitignore`) and nothing
else. It upper-cases the first letter of the display name (`libSQL` becomes `LibSQL`); step 4
overwrites the manifest and operations from templates. In `README.md`, fix the heading and
replace the docs link (a placeholder page that does not exist) with a one-line description. Then:

1. Register the plugin: append an entry to `server/src/assets/marketplace/plugins.json` (the
   file has no trailing newline; keep it that way). From the repo root, fill in and run (it inserts one entry before the closing `]` in the file's own format):

   ```bash
   node -e 'const fs=require("fs"),f="server/src/assets/marketplace/plugins.json",s=fs.readFileSync(f,"utf8").trimEnd();
   const e={name:"<Display Name>",description:"<one line>",version:"1.0.0",id:"<id>",author:"Tooljet",timestamp:new Date().toUTCString(),repo:"",tags:["<Category>"]};
   fs.writeFileSync(f,s.slice(0,-1).trimEnd()+",\n"+JSON.stringify(e,null,2).replace(/\[\s+("[^"]*")\s+\]/,"[$1]").replace(/^/gm,"  ")+"\n]")'
   ```

   `tags` is free-form: reuse an existing one when it fits, else one short Title Case category
   (`Database`, `Weather`). To list them:
   `node -p '[...new Set(require("./server/src/assets/marketplace/plugins.json").flatMap((p) => p.tags || []))]'`

2. Link the workspace: `npm i` in `marketplace/` (updates `package-lock.json`).
3. If the id contains `-`, rename the generated class in `lib/index.ts` to a valid identifier.
4. Icon: save the provided SVG as `lib/icon.svg`, otherwise keep the placeholder.

Identity rule: `marketplace/AGENTS.md` (plugins.json `id` = `source.kind` = directory name).

## 4. Generate

Two independent jobs, both fed `plugin-spec.json`, the PRD, the API source, and the plugin
directory:

- Backend, `lib/index.ts` and `lib/types.ts`: `references/backend.md`.
- Frontend, `lib/manifest.json`, `lib/operations.json`, `openapi-specs/`: `references/frontend.md`.

If your harness supports subagents, run them in parallel, one each, and pass the reference path
in the prompt. Otherwise do backend then frontend in this session. Both need
`references/manifest-and-operations.md` for widget and auth patterns. Install what `index.ts`
imports (`npm i <pkg> --workspace=@tooljet-marketplace/<id>`) before step 5.

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

| Mistake                                             | Fix                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `@spec/` reference with no file in `openapi-specs/` | File name without extension must equal the `@spec/<id>/<name>` suffix |
| Hand-written operations for an OpenAPI source       | Use `react-component-api-endpoint` with `@spec/`                      |
| Retrying a Postman share URL that returns HTML      | Ask the user to export the collection file                            |
| Adding jest tests as a gate                         | Plugin tests are not wired up; verify with build + validator          |
