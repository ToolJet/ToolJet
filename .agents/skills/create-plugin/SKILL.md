---
name: create-plugin
description: >-
  Create or validate a ToolJet marketplace data-source plugin from an OpenAPI spec,
  Postman collection, npm package, database driver, or API docs. Use when asked to
  create, generate, scaffold, or validate a marketplace plugin or connector.
---

# Build a marketplace plugin

Turn an API source into a working plugin under `marketplace/plugins/<id>/`: a connection form
(`manifest.json`), a query form (`operations.json`), and a `QueryService` (`index.ts`). The
repo-owned validator is the gate, not this document. Built-in connectors in `plugins/packages/`
are out of scope; if asked for one, stop and say so.

Read `marketplace/AGENTS.md` first. It owns the codebase facts (layout, registry, build, OAuth
widget, `customTesting`, `@spec/` hosting); this skill links to it rather than repeating it.

To validate an existing plugin only, skip to step 5.

## 1. Intake

Ask one question at a time. Skip any the user already answered. If the user says to use defaults,
state them: type `api`, no PRD, no icon, no design reference, current branch, version `1.0.0`, V1.

| #   | Question                    | Notes                                                                            |
| --- | --------------------------- | -------------------------------------------------------------------------------- |
| 1   | Display name and plugin id? | id: lowercase, `[a-z][a-z0-9_-]*`, e.g. "Stripe" / `stripe`                      |
| 2   | Plugin type?                | `api`, `database`, or `cloud-storage` (the scaffold's `--type`)                  |
| 3   | PRD or requirements?        | Issue URL, inline text, file path, or none                                       |
| 4   | API source?                 | OpenAPI file or URL, Postman collection, npm package, docs URL, or a description |
| 5   | Icon?                       | SVG URL or path, or none (keep the scaffolded placeholder)                       |
| 6   | Design reference?           | Figma link, screenshot, or none                                                  |
| 7   | Where to work?              | Current branch or a new branch/worktree. Default: current branch                 |

Right after question 1, check the id is free:

```bash
grep -n '"id": "<id>"' server/src/assets/marketplace/plugins.json; ls marketplace/plugins/<id>
```

If either exists, stop and ask whether to update that plugin instead. Updating skips step 3 and
edits the existing files. Never add a second registry entry for the same id: the validator fails
on duplicates (the CLI would abort with "Plugin id already exists").

## 2. Spec

Produce `plugin-spec.json`, the contract both generators work from. Route by source:

| Source                                        | Reference                                                           |
| --------------------------------------------- | ------------------------------------------------------------------- |
| OpenAPI spec (`.json`, `.yaml`, URL)          | `references/intake-openapi.md`                                      |
| Postman collection                            | `references/intake-postman.md`, then `references/intake-openapi.md` |
| npm package, DB driver, docs URL, description | `references/intake-docs.md`                                         |

Validate it against `assets/plugin-spec.schema.json` (draft-07; ajv is installed in
`marketplace/`):

```bash
cd marketplace && node -e "const A=require('ajv'),fs=require('fs');const v=new A({allErrors:true}).compile(JSON.parse(fs.readFileSync(process.argv[1])));if(!v(JSON.parse(fs.readFileSync(process.argv[2]))))throw new Error(JSON.stringify(v.errors,null,1));console.log('spec ok')" ../.agents/skills/create-plugin/assets/plugin-spec.schema.json <path-to>/plugin-spec.json
```

Write `plugin-spec.json` outside the repo (or delete it before committing). It is an
intermediate artifact and is never committed.

**User gate.** Show the auth type, the operation list, `operationsMode`, and the schema version
(V1 unless the form needs cascading V2 widgets). Proceed only on a yes.

## 3. Scaffold

Render the repo's plugin templates directly; no prompts. This is what `tooljet plugin create`
runs internally (the human path is in `marketplace/AGENTS.md`):

```bash
cd marketplace
npx --yes hygen@6 plugin new --name <id> --type <type> --display_name "<Display Name>" --plugins_path .
```

It writes `plugins/<id>/` (`lib/{index.ts,types.ts,manifest.json,operations.json,icon.svg}`,
`__tests__/index.js`, `package.json`, `tsconfig.json`, `README.md`, `.gitignore`) and nothing
else. Then:

1. Register the plugin: append an entry to `server/src/assets/marketplace/plugins.json`,
   formatted like its neighbours (the file has no trailing newline; keep it that way). `tags` is
   free-form; reuse an existing tag when one fits:

   ```json
   {
     "name": "<Display Name>",
     "description": "<one line>",
     "version": "1.0.0",
     "id": "<id>",
     "author": "Tooljet",
     "timestamp": "<new Date().toUTCString()>",
     "repo": "",
     "tags": ["<Category>"]
   }
   ```

2. Link the workspace: `npm i` in `marketplace/` (updates `package-lock.json`). Backend
   dependencies are installed in step 4.
3. If the id contains `-`, rename the generated class in `lib/index.ts` to a valid identifier.
4. Icon: save the provided SVG as `lib/icon.svg`, otherwise keep the placeholder.

Identity rule: `marketplace/AGENTS.md` (plugins.json `id` = `source.kind`; directory = id by
convention).

## 4. Generate

Two independent jobs, both fed `plugin-spec.json`, the PRD, the API source, and the plugin
directory:

- Backend, `lib/index.ts` and `lib/types.ts`: `references/backend.md`.
- Frontend, `lib/manifest.json`, `lib/operations.json`, `openapi-specs/`: `references/frontend.md`.

If your harness supports subagents, run them in parallel, one each, and pass the reference path
in the prompt. Otherwise do backend then frontend in this session. Install the backend's dependencies before
step 5. Both need `references/manifest-and-operations.md` for widget and auth patterns.

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
